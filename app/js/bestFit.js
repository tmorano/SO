sistemasOperacionais.factory('BestFitService', function () {
    var bestFit = {};

    bestFit.iniciarMemoria = function (args) {
        bestFit.config = args;
        bestFit.memoryBlock = args.memoryBlock;
        bestFit.memory = {
          totalSize: 1024,
          size: 1024,
          blocks: []
        };
        bestFit.count = {
            totalBlockMemory : bestFit.config.totalMemory
        };

    }

    bestFit.isAlocado = function(processo){
      var alocado = false;
      this.memory.blocks.forEach(function(p){
        if(p.processo && p.processo.pid == processo.pid){
          alocado = true;
        }
      })
      return alocado;
    }

    bestFit.adicionarNaMemoria = function (processo) {
      isAlocado = this.isAlocado(processo);
      isAumentouMemoria = processo.chance() && isAlocado;

      if(isAumentouMemoria){
        processo.memory += ((min,max)=>{
          return Math.floor(Math.random() * (max - min + 1)) + min
        })(16,128);
      }

      if(isAlocado && !isAumentouMemoria) return;

      if(processo.memory > this.memory.totalSize || this.memory.size < 1){
        processo.state = 'Abortado';
        return;
      }

      orderedBlocks = this.memory.blocks.sort(function(a,b){
        return b.size - a.size;
      })

      bestBlock = null;
      // encontra bloco que se aproxima em tamanho do processo
      orderedBlocks.forEach(function(block){
        if(!isAumentouMemoria && !block.processo && block.size >= processo.memory){
          bestBlock = block;
          return;
        }else if(block.processo && block.processo.pid == processo.pid){
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
        this.memory.blocks.push(block)
        this.memory.size -= processo.memory;
        this.config.totalMemory -= processo.memory;
        bestFit.config.arrayOfProcessMemory.series.push(block);
      }else{
        // existe e aumentou de tamanho
        if(isAumentouMemoria){
          var nextBlock = this.memory.blocks[bestBlock.id + 1];
          // procura adjacente a ele,se existir e estiver vazio ocupa
          if(nextBlock && !nextBlock.processo){
            nextBlock.processo = processo
            nextBlock.name = 'Processo ' + processo.pid;
            this.memory.size -= processo.memory;
            this.config.totalMemory -= processo.memory;
          }else{
            processo.state = 'Abortado';
            return;
          }
        }else{
          // se não aumentou e encontrou um vazio
          bestBlock.processo = processo;
          bestBlock.name = 'Processo ' + processo.pid;
        }
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

    bestFit.encerrarProcesso = function(processo){
      this.memory.blocks.forEach(function(block){
        if(block.processo && block.processo.pid == processo.pid){
          block.processo.state = 'Encerrado';
          block.name = 'DISPONIVEL';
          bestFit.memory.size += processo.memory;
          bestFit.config.totalMemory += processo.memory;
          block.processo = null;
          return;
        }
      })
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
