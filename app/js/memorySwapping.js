sistemasOperacionais.factory('MemorySwappingService', function (MemoryHelper) {
    var virtualMemory = {};
    virtualMemory.blocks = [];
    var sortedVirtualBlocks = [];
    var processToRemove = {};

    virtualMemory.needsSwap = function(memoryService,memory){
        //Vamos verificar o espaço da memoria está abaixo de 70%
        return Math.floor(((memoryService.memory.totalSize - (memory ? (memoryService.memory.size - memory) : memoryService.memory.size)) / memoryService.memory.totalSize) * 100);
    }

    virtualMemory.swapBack = function(memoryService,processo){
        var success = true;
        var blocks = this.blocks.filter(function(block){
            return block.processo && block.processo.pid == processo.pid;
        });
        if(blocks.length == 0) {
            debugger;
            return;
        }
        blocks.every(function(block){
            if(memoryService.split){
                var threshold = Math.floor( (memoryService.memory.totalSize -  memoryService.memory.size) / memoryService.memory.totalSize * 100 );
                var needsSwap = Math.floor( (memoryService.memory.totalSize -  memoryService.memory.size - block.size) / memoryService.memory.totalSize * 100);
                if(threshold > 70){
                    virtualMemory.swap(memoryService);
                }
                if(success){
                    if(!processo){
                        debugger;
                    }
                    var blockInMemory = memoryService.split(processo,block.size,memoryService.memory.blocks[0],0);
                    if(!blockInMemory){
                        processo.state = 'Abortado';
                        success = false;
                    }else{
                        processo.blocks.push(blockInMemory.id);
                    }
                }
                block.name = 'DISPONIVEL';
                block.processo = null;
                block.usado = 0;
                processo.blocks.splice(processo.blocks.indexOf(block.id),1);
                return true;
            }
        });
        return success;
    }

    virtualMemory.hasSwapped = function(processo){
        for(var i = 0;processo.blocks && i < processo.blocks.length;i++){
            if(isNaN(processo.blocks[i])){
                return true;
            }
        }
        return false;
    }

    virtualMemory.swap = function (memoryService) {
        var stop = false;
        if((usage = virtualMemory.needsSwap(memoryService)) > 70){

            // Realizar o swap dos processos aguardando, iniciar pelo ultimo da fila de prioridades
            //Percorrer todas as filas de prioridade do round robin
            // os ultimos da fila sao o reverse()
            memoryService.config.filaDePrioridade.every(function(fila){
                fila.filter(function(processo){
                        return processo.state == 'Aguardando';
                    })
                    .reverse().every(function(processo){
                    var processBlocks = [],processBlocksIDs = [];
                    processo.blocks.forEach(function(id){
                        processBlocks = processBlocks.concat(memoryService.memory.blocks.filter(function(block){
                            return block.id == id;
                        }))
                    });

                    // percorre a lista de blocos do processo e verifica se ainda tem como enviar mais pro hd
                    for(var i = 0;i < processBlocks.length;i++){
                        if(processBlocks[i].isVirtual){
                            continue;
                        }
                        if((usage = virtualMemory.needsSwap(memoryService)) > 70){
                            // var block = processBlocks.splice(i,1)[0];
                            processo.blocks.splice(processo.blocks.indexOf(processBlocks[i].id),1);
                            var block = processBlocks[i];
                            // bloco que vai pro hd se não já tiver um para ele
                            var newBlock = angular.copy(block);

                            block.processo = null;
                            block.name = 'DISPONIVEL';
                            block.usado = 0;

                            newBlock.id = btoa(newBlock.id);
                            newBlock.processo = processo;
                            newBlock.isVirtual = true;
                            newBlock.data = newBlock.data.reverse();
                            processBlocksIDs.push(newBlock.id);
                            delete newBlock.proximo;

                            memoryService.config.memory.size += block.size;
                            // tenta fazer o merge do bloco que liberou
                            memoryService.encerrarProcesso(null,true);
                            // aloca
                            virtualMemory.allocate(processo,newBlock,memoryService);
                        }else{
                            stop = true;
                            break;
                        }
                    }
                    if(processBlocksIDs.length > 0){
                        // atualiza a lista de blocos do processo
                        processo.blocks = processo.blocks.concat(processBlocksIDs);
                    }
                    return !stop;
                });
                // só continua se ainda der para fazer swap
                return (usage = virtualMemory.needsSwap(memoryService)) <= 70;
            });
        }else{
            // volta pro hd os blocos que foram enviado caso reduza o threhold
            if(virtualMemory.blocks.length == 0) return;
            memoryService.config.filaDePrioridade.every(function(fila){
                fila.filter(function(processo){
                        return processo.state == 'Abortado';
                    })
                    .every(function(processo){
                        var processBlocks = [];
                        processo.blocks.forEach(function(id){
                            processBlocks = processBlocks.concat(virtualMemory.blocks.filter(function(block){
                                return block.id == id;
                            }));
                        });

                        if(memoryService.split){
                            for(var i = 0;i < processBlocks.length; i++){
                                if((usage = virtualMemory.needsSwap()) <= 70){
                                    memoryService.split(processo,processBlocks[i].size,memoryService.memory.blocks[0],0);
                                    processBlocks[i].name = 'DISPONIVEL';
                                    processBlocks[i].usado = 0;
                                    processBlocks[i].processo = null;
                                }else{
                                    stop = true;
                                    break;
                                }
                            }
                        }
                        return !stop;
                    })
                return (usage = virtualMemory.needsSwap(memoryService)) <= 70;
            });
        }
    }

    virtualMemory.allocate = function(processo,block,memoryService){
        /**Com o processo encontrado vamos adicionar no HD utilizando o bestfit **/
        /** ordena para conseguir o melhor bloco **/
        sortedVirtualBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
        var bestFitBlock;
        for(var i = 0;i < sortedVirtualBlocks.length; i++){
            if(!sortedVirtualBlocks[i].processo && sortedVirtualBlocks[i].size >= processToRemove.size){
                bestFitBlock = sortedVirtualBlocks[i];
            }
        }
        /** não encontrou um bloco **/
        if(!bestFitBlock){

            // var block = {
            //   id: virtualMemory.blocks.length,
            //   processo: processToRemove,
            //   size: processToRemove.memory,
            //   data: [0,processToRemove.memory],
            //   name: 'Processo ' + processToRemove.pid,
            //   usado: processToRemove.memory,
            // };
            /** incrementa a quantidade total de blocos criados **/
            virtualMemory.blocks.push(block);
            bestFitBlock = block;
            /** lista auxiliar de blocos ordenados pelo tamanho **/
            sortedVirtualBlocks.push(block);
            memoryService.config.arrayOfProcessMemory.series.push(block);
        }else{
            /** se encontrou um bloco aloca ele **/
            bestFitBlock.name = 'Processo ' + processToRemove.pid;
            bestFitBlock.processo = processToRemove;
            bestFitBlock.usado = processToRemove.memory < bestFitBlock.size ? processToRemove.memory : bestFitBlock.size;
        }
    }

    return virtualMemory;
});