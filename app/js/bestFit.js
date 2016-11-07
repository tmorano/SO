sistemasOperacionais.factory('BestFitService', function (MemoryHelper) {
    var bestFit = {};

    bestFit.adicionarNaMemoria = function (processo) {
      isAlocado = MemoryHelper.isAlocado(processo);

      if(isAlocado) return;

      orderedBlocks = MemoryHelper.sort();

      bestBlock = null;
      // encontra bloco que se aproxima em tamanho do processo
      orderedBlocks.forEach(function(block){
        // encontra o melhor bloco para encaixar o processo
        if(!block.processo && block.size >= processo.memory){
          bestBlock = block;
          return;
        }
      });

      // bloco não existe
      if(!bestBlock){
        var block = {
          id: this.memory.blocks.length,
          processo: processo,
          name: 'Processo ' + processo.pid,
          size: processo.memory,
          data : [0,processo.memory]
        };
        this.memory.blocks.push(block);
        this.memory.req++;
        this.memory.size -= processo.memory;
        this.config.totalMemory -= processo.memory;
        bestFit.config.arrayOfProcessMemory.series.push(block);
      }else{
        bestBlock.processo = processo;
      }

        // var memoryAllocated = false;

        //Verificando no MemoryBlock se existe algum espaço com encaixe e livre
            // bestFit.config.arrayOfProcessMemory.series.forEach(function(eachBlock){
            //     if(eachBlock.pid == processo.pid){
            //         memoryAllocated = true;
            //     }else if(eachBlock.data[1] == processo.memory && eachBlock.pid == undefined){
            //         eachBlock.name = 'Processo: ' + processo.pid;
            //         eachBlock.pid = processo.pid;
            //         memoryAllocated = true;
            //         bestFit.config.totalMemory -= processo.memory;
            //     }
            // })

        // Criar novo bloco caso nao encontre
        // if(!memoryAllocated) {
        //     // verificar a disponibilidade de memoria e core para o novo bloco
        //     if (bestFit.count.totalBlockMemory > processo.memory) {
        //         var newBlock = {
        //             pid : processo.pid,
        //             name : 'Processo ' + processo.pid,
        //             data : [0,processo.memory]
        //         }
        //         bestFit.config.arrayOfProcessMemory.series.push(newBlock);
        //         bestFit.config.totalMemory -= processo.memory;
        //         bestFit.count.totalBlockMemory -= processo.memory;
        //     }else{
        //         // Abortar processo
        //         processo.state = 'Abortado';
        //     }
        // }
    }

    bestFit.aumentarMemoria = function(processo){
      newSize = MemoryHelper.aumentarMemoria(processo,16,128);
      if(MemoryHelper.isFull(processo)){
        processo.state = 'Abortado';
        console.log('Processo abortado: Memória Cheia','Memória Total: ' + this.memory.size,' Memória do Processo: ' + processo.memory)
        return false;
      }
      blockIndex = MemoryHelper.indexOf(this.memory.blocks,processo);
      changedBlocks = [];
      blockList = this.memory.blocks.splice(blockIndex + 1,this.memory.blocks.length);
      remainingMemory = size;
      var erro = !blockList.every((nextBlock)=>{
        if(remainingMemory <= 0 || nextBlock.processo) return false;
        if(!nextBlock.processo){
          nextBlock.processo = processo;
          nextBlock.name = 'Processo ' + processo.pid;
          remainingMemory -= nextBlock.size;
          changedBlocks.push(nextBlock);
        }
        return true;
      });

      if(erro){
        changedBlocks.every((block)=>{
          block.processo = null;
        });
        processo.state = 'Abortado';
        console.log('Problema na alocação do processo ' + processo.pid + ' abortado.');
        return false;
      }else{
        this.config.totalMemory -= newSize;
        return true;
      }

    }

    bestFit.encerrarProcesso = function(processo){
      MemoryHelper.encerrarProcesso(processo,this);
      // this.memory.blocks.forEach(function(block){
      //   if(block.processo && block.processo.pid == processo.pid){
      //     block.processo.state = 'Encerrado';
      //     block.name = 'DISPONIVEL';
      //     bestFit.memory.size += processo.memory;
      //     bestFit.config.totalMemory += processo.memory;
      //     block.processo = null;
      //     return;
      //   }
      // })
      // bestFit.config.arrayOfProcessMemory.series.forEach(function (eachBlockFromView){
      //   if(eachBlockFromView.pid == processo.pid ){
      //     eachBlockFromView.pid = undefined;
      //     eachBlockFromView.name = 'DISPONIVEL';
      //     bestFit.config.totalMemory += processo.memory;
      //     return;
      //   }
      // })
    }

    return bestFit;
});
