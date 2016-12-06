sistemasOperacionais.factory('MemorySwappingService', function (MemoryHelper) {
var virtualMemory = {};
    virtualMemory.blocks = [];
    var sortedVirtualBlocks = [];
    var processToRemove = {};

    virtualMemory.swap = function (memoryService,newMemory) {

        //Vamos verificar o espaço da memoria está abaixo de 70%
        var memoryUsage =  function(){
          return Math.floor(((memoryService.memory.totalSize - (newMemory ? (memoryService.memory.size - newMemory) : memoryService.memory.size)) / memoryService.memory.totalSize) * 100);;
        }
        var blocksRemoved = [];

        if(memoryUsage() > 70){
            // Realizar o swap dos processos aguardando, iniciar pelo ultimo da fila de prioridades
            //Percorrer todas as filas de prioridade do round robin

            var processos = [];
            memoryService.config.filaDePrioridade.forEach(function(fila){
              fila.filter(function(processo){
                return processo.state == 'Aguardando';
              })
              .reverse().every(function(processo){
                var processBlocks = [];

                processo.blocks.forEach(function(id){
                  processBlocks = processBlocks.concat(memoryService.memory.blocks.filter(function(block){
                    return block.id == id;
                  }))
                });

                for(var i = 0;i < processBlocks.length;i++){
                  if(memoryUsage() > 70){
                    processo.blocks.splice(i,1);
                    var block = processBlocks.splice(i,1)[0];
                    var newBlock = angular.copy(block);
                    block.processo = null;
                    block.name = 'DISPONIVEL';
                    block.usado = 0;

                    newBlock.id = btoa(newBlock.id);
                    newBlock.processo = processo;
                    newBlock.isVirtual = true;
                    newBlock.data = newBlock.data.reverse();
                    delete newBlock.proximo;

                    blocksRemoved.push(newBlock);
                    memoryService.config.memory.size += block.size;
                  }else{
                    break;
                  }
                }

                if(blocksRemoved.length > 0){
                  memoryService.encerrarProcesso(null,true);
                  for(var i = 0;i < blocksRemoved.length;i++){
                    virtualMemory.blocks.push(blocksRemoved[i]);
                    memoryService.config.arrayOfProcessMemory.series.push(blocksRemoved[i]);
                  }
                  blocksRemoved = [];
                };
              });
            });

            // memoryService.config.filaDePrioridade.every(function(eachFila){
            //     memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
            //     if(memoryUsage < 70){
            //         return true;
            //     }else{
            //         if(eachFila.length == 0){
            //             return false;
            //         }
            //         for(var j = eachFila.length-1; j>0; j--){
            //             var proc = eachFila[j];
            //             if(proc.state == 'Aguardando'){
            //                 memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
            //                 if(memoryUsage > 70){
            //                     //Encontrar processos no bloco do algoritmo
            //                     memoryService.memory.blocks.forEach(function(eachBlock){
            //                         if(eachBlock.processo){
            //                             if(eachBlock.processo.pid == proc.pid){
            //                                 processToRemove = eachBlock.processo;
            //                                 processToRemove.isSwapped = true;
            //                                 MemoryHelper.encerrarProcesso(eachBlock.processo,memoryService);
            //                             }
            //                         }
            //                     });
            //                     virtualMemory.blocks = [];
            //                     /**Com o processo encontrado vamos adicionar no HD utilizando o bestfit **/
            //                     /** ordena para conseguir o melhor bloco **/
            //                     sortedVirtualBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
            //                     var bestFitBlock;
            //                     for(var i = 0;i < sortedVirtualBlocks.length; i++){
            //                         if(!sortedVirtualBlocks[i].processo && sortedVirtualBlocks[i].size >= processToRemove.size){
            //                             bestFitBlock = sortedVirtualBlocks[i];
            //                         }
            //                     }
            //                     /** não encontrou um bloco **/
            //                     if(!bestFitBlock){
            //
            //                         var block = {
            //                             id: virtualMemory.blocks.length,
            //                             processo: processToRemove,
            //                             size: processToRemove.memory,
            //                             data: [0,processToRemove.memory],
            //                             name: 'Processo ' + processToRemove.pid,
            //                             usado: processToRemove.memory,
            //                         };
            //                         /** incrementa a quantidade total de blocos criados **/
            //                         virtualMemory.blocks.push(block);
            //                         bestFitBlock = block;
            //                         /** lista auxiliar de blocos ordenados pelo tamanho **/
            //                         sortedVirtualBlocks.push(block);
            //                         memoryService.config.arrayOfProcessMemory.series.push(block);
            //                     }else{
            //                         /** se encontrou um bloco aloca ele **/
            //                         bestFitBlock.name = 'Processo ' + processToRemove.pid;
            //                         bestFitBlock.processo = processToRemove;
            //                         bestFitBlock.usado = processToRemove.memory < bestFitBlock.size ? processToRemove.memory : bestFitBlock.size;
            //                     }
            //                 }
            //             }
            //         }
            //         return false;
            //     }
            // });
        }else{
          
        }
    }
    return virtualMemory;
});
