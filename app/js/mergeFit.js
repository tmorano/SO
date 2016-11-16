sistemasOperacionais.factory('MergeFitService', function (MemoryHelper,$interval) {
    var mergeFit = {};
    var sortedBlocks = [];
    var tamblock = 0;
    var header;
    var blockCounter = 0;

    mergeFit.desfazerAlocacoes = function(blocks){
      blocks.forEach(function(block){
        block.processo = null;
        block.name = 'DISPONIVEL';
      });
    }

    mergeFit.adicionarNaMemoria = function (processo) {
      if(MemoryHelper.isAlocado(processo)) return;

      if(this.memory.blocks.length == 0){
        mergeFit.memory.blocks.push({
          processo: null,
          size: [0,1024],
          size: 1024,
          id: ++blockCounter,
          name: 'DISPONIVEL'
        });
        mergeFit.config.arrayOfProcessMemory.series = this.memory.blocks;
      }
      var novoBloco = null;
      if(processo.memory > mergeFit.memory.size){
        processo.state = 'Abortado';
        return;
      }else{
        novoBloco = mergeFit.split(processo,this.memory.blocks[0],0);
        alocado = false;
      }
      console.log(novoBloco);
      this.memory.size -= processo.memory;
      contador -= processo.memory;
    };

    var lastNode;
    var contador = 1024;
    var alocado = false;
    mergeFit.split = function(processo,current,index){
      return (function(processo,current,index){
        var self = this;
        if(!current) return;
        /** se tiver bloco com processo pula ou se o tamanho for menor **/
        if((current.processo || (!current.processo && current.size < processo.memory))){
          self.next = mergeFit.split(processo,current.proximo,index + 1);
        }


        if(!current.processo && !alocado){
          /** se o bloco for maior que a requisição **/
          if(current.size > processo.memory){
            mergeFit.memory.blocks.splice(index,1);
            var livre = {
              id: ++blockCounter,
              processo: null,
              name: 'DISPONIVEL',
              size: current.size - processo.memory,
              data: [0,current.size - processo.memory],
              usado: 0,
            };
            var usado = {
              id: ++blockCounter,
              processo: processo,
              name: 'Processo ' + processo.pid,
              size: processo.memory,
              data: [0,processo.memory],
              usado: processo.memory,
            };
            if(mergeFit.memory.blocks[index - 1]){
              mergeFit.memory.blocks[index - 1].proximo = usado;
            }
            usado.proximo = livre;
            livre.proximo = mergeFit.memory.blocks[index];
            mergeFit.memory.blocks.splice(index,0,livre);
            mergeFit.memory.blocks.splice(index,0,usado);
            alocado = true;
            lastBlockProcess[processo.pid] = processo;
            return usado;
          }else{
            /** só aloca quando for o tamanho **/
            current.processo = processo;
            current.name = 'Processo ' + processo.pid;
            current.usado = processo.memory < current.size ? processo.memory : current.size;
            return current;
          }
        }
      })(processo,current,index);
    }

    var lastBlockProcess = [];
    mergeFit.aumentarMemoria = function(processo){
      var newSize = MemoryHelper.random(2,128);
      if(newSize > mergeFit.memory.size){
        processo.state = 'Abortado';
        return;
      }

      var bloco = lastBlockProcess[processo.pid];

      if(newSize < bloco.size){
        bloco.usado += newSize;
      }else{
        mergeFit.split(processo,newSize);
      }

      return true;
    };

    mergeFit.merge = function(processo,block,index){
      return (function(processo,block,index){
        if(!block) return;
        var next =  mergeFit.merge(processo,block.proximo,index + 1);

        if(block.processo && block.processo.pid == processo.pid){
          block.processo = null;
          block.name = 'DISPONIVEL';
          block.usado = 0;
        }

        if(!block.processo && next && !next.processo){
          var previous = mergeFit.memory.blocks[index - 1];
          var mergeBlocks = mergeFit.memory.blocks.splice(index,2);

          var merged = {
            id: ++blockCounter,
            name: 'DISPONIVEL',
            processo: null,
            size: mergeBlocks[0].size + mergeBlocks[1].size,
            usado: 0,
            data: [0,mergeBlocks[0].size + mergeBlocks[1].size],
          }
          if(previous){
            previous.proximo = merged;
          }
          merged.proximo = mergeFit.memory.blocks[index];
          mergeFit.memory.blocks.splice(index,0,merged);
          if(mergeFit.memory.blocks[index - 1] && mergeFit.memory.blocks[index - 1].proximo.id !== mergeFit.memory.blocks[index].id){
            debugger;
          }
          if(mergeFit.memory.blocks[index + 1] && mergeFit.memory.blocks[index].proximo.id !== mergeFit.memory.blocks[index + 1].id){
            debugger;
          }
        }

        return mergeFit.memory.blocks[index];

      })(processo,block,index);
    }

    mergeFit.encerrarProcesso = function(processo,block,index){
      this.memory.size += processo.memory;
      contador += processo.memory;
      this.merge(processo,this.memory.blocks[0],0);
    };

    return mergeFit;
});
