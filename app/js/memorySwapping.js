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
        var stop = false;
        if((usage = memoryUsage()) > 70){
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
                  if((usage = memoryUsage()) > 70 && !processBlocks[i].isVirtual){
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

                    memoryService.config.memory.size += block.size;
                    memoryService.encerrarProcesso(null,true);
                    virtualMemory.allocate(processo,newBlock,memoryService);
                  }else{
                    stop = true;
                    break;
                  }
                }
                return !stop;
              });
            });
        }else{
          if(virtualMemory.blocks.length == 0) return;
          memoryService.config.filaDePrioridade.forEach(function(fila){
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
                  if((usage = memoryUsage()) <= 70){
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
