sistemasOperacionais.factory('MemorySwappingService', function (MemoryHelper) {
    var virtualMemory = {};
    virtualMemory.blocks = [];
    var sortedVirtualBlocks = [];
    var processToRemove = {};
    var processToReturn = {};

    virtualMemory.swap = function (memoryService) {
        //Vamos verificar o espaço da memoria está abaixo de 70%
        var memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);

        if(memoryUsage > 70){
            // Realizar o swap dos processos aguardando, iniciar pelo ultimo da fila de prioridades
            //Percorrer todas as filas de prioridade do round robin

            for(var j = 0; j< 4; j++ ){
                memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
                if(memoryUsage < 70 || memoryService.config.filaDePrioridade[j].length == 0 || memoryService.config.filaDePrioridade[j].length == 1){
                    continue;
                }
                for(var i = memoryService.config.filaDePrioridade[j].length - 1; i>0; i--){
                    var proc = memoryService.config.filaDePrioridade[j][i];
                    if(proc && proc.state == 'Aguardando' && !proc.virtual){
                        memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
                        if(memoryUsage > 70){
                            //Encontrar processos no bloco do algoritmo
                            memoryService.memory.blocks.forEach(function(eachBlock){
                                if(eachBlock.processo){
                                    if(eachBlock.processo.pid == proc.pid){
                                        processToRemove = eachBlock.processo;
                                        eachBlock.processo.virtual = true;
                                        MemoryHelper.encerrarProcesso(eachBlock.processo,memoryService);
                                    }
                                }
                            });
                            /**Com o processo e bloco encontrado vamos adicionar no HD utilizando o bestfit **/
                            /** ordena para conseguir o melhor bloco **/
                            sortedVirtualBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
                            var virtualBlock;
                            for(var i = 0;i < sortedVirtualBlocks.length; i++){
                                if(!sortedVirtualBlocks[i].processo && sortedVirtualBlocks[i].size >= processToRemove.memory){
                                    virtualBlock = sortedVirtualBlocks[i];
                                }
                            }
                            /** não encontrou um bloco **/
                            if(!virtualBlock){
                                var block = {
                                    id: virtualMemory.blocks.length,
                                    processo: processToRemove,
                                    size: processToRemove.memory,
                                    data: [0,processToRemove.memory],
                                    name: 'Processo ' + processToRemove.pid,
                                    usado: processToRemove.memory,
                                    virtual : true
                                };
                                /** incrementa a quantidade total de blocos criados **/
                                virtualMemory.blocks.push(block);
                                virtualBlock = block;
                                /** lista auxiliar de blocos ordenados pelo tamanho **/
                                sortedVirtualBlocks.push(block);

                                memoryService.config.arrayOfProcessMemory.series.push(block);
                            }else{
                                /** se encontrou um bloco aloca ele **/
                                virtualBlock.name = 'Processo ' + processToRemove.pid;
                                virtualBlock.processo = processToRemove;
                                virtualBlock.usado = processToRemove.memory < virtualBlock.size ? processToRemove.memory : virtualBlock.size;
                                //Ajustar na view
                                memoryService.config.arrayOfProcessMemory.series.forEach(function(eachBlock){
                                    if(eachBlock.virtual && virtualBlock.id == eachBlock.id){
                                        eachBlock.name = 'Processo ' + processToRemove.pid;
                                        eachBlock.processo = processToRemove;
                                        eachBlock.usado = processToRemove.memory < eachBlock.size ? processToRemove.memory : eachBlock.size;
                                    }
                                });

                            }
                        }
                    }

                }
            }
        }else{
            virtualMemory.returnProcess(memoryService);
        }
    }

    virtualMemory.returnProcess = function (memoryService){
        //Vamos verificar o espaço da memoria está acima de 70%
        var memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
        if(memoryUsage < 70){
            //Verificar a fila de aptos e retornar para memoria o mais proximo de ser alocado.
            //Percorrer todas as filas de prioridade do round robin
            for(var j = 0; j< 4; j++ ) {
                memoryUsage = Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
                if (memoryUsage > 70 || memoryService.config.filaDePrioridade[j].length == 0) {
                    continue;
                }
                for(var i = 0; i < memoryService.config.filaDePrioridade[j].length-1; i++){
                    var proc = memoryService.config.filaDePrioridade[j][i];
                    if(proc.state == 'Aguardando' && proc.virtual){
                        memoryUsage =   Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
                        if(memoryUsage < 70){
                            processToReturn = proc;
                            // Liberar bloco virtual
                            virtualMemory.blocks.forEach(function(eachBlock){
                                if(eachBlock.processo){
                                    if(eachBlock.processo.pid == processToReturn.pid){
                                        processToReturn = eachBlock.processo;
                                        eachBlock.processo.virtual = false;
                                        eachBlock.processo = undefined;
                                        eachBlock.name = 'DISPONIVEL';
                                        //Utilizar o algoritmo selecionado para alocar novamento o processo.
                                        memoryService.adicionarNaMemoria(processToReturn);
                                    }
                                }
                            });
                            //Liberar bloco virtual da view
                            memoryService.config.arrayOfProcessMemory.series.forEach(function(eachBlock){
                                if(eachBlock.processo){
                                    if(eachBlock.processo.pid == processToReturn.pid){
                                        processToReturn = eachBlock.processo;
                                        eachBlock.processo.virtual = false;
                                        eachBlock.processo = undefined;
                                        eachBlock.name = 'DISPONIVEL';
                                    }
                                }
                            });
                        }
                    }
                }

            }
        }
    }

    return virtualMemory;
});