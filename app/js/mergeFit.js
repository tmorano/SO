sistemasOperacionais.factory('MergeFitService', function (MemoryHelper,$interval) {
    var mergeFit = {};
    var sortedBlocks = [];
    var tamblock = 0;
    var header;
    var blockCounter = 0;

    mergeFit.adicionarNaMemoria = function (processo) {
      if(processo.state != 'Pronto' || processo.state == 'Abortado') return;

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
      if(alocado){
        debugger;
      }
      var novoBloco = null;
      if(processo.memory > mergeFit.memory.size){
        processo.state = 'Abortado';
        return;
      }else{
        novoBloco = mergeFit.split(processo,processo.memory,this.memory.blocks[0],0);
        alocado = false;
      }

      console.log(novoBloco);

      /** não conseguiu alocar **/
      if(!novoBloco){
        processo.state = 'Abortado';
        return;
      }

      this.memory.size -= processo.memory;
    };

    var lastNode;
    var contador = 1024;
    var alocado = false;
    mergeFit.split = function(processo,memory,current,index){
      return (function(processo,current,index){
        var self = this;
        if(!current) return;
        /** se tiver bloco com processo pula ou se o tamanho for menor **/
        if((current.processo || (!current.processo && current.size < memory))){
          self.next = mergeFit.split(processo,memory,current.proximo,index + 1);
        }


        if(!current.processo && !alocado){
          /** fazer o split **/
          if(current.size > memory){
            mergeFit.memory.blocks.splice(index,1);
            var livre = {
              id: ++blockCounter,
              processo: null,
              name: 'DISPONIVEL',
              size: current.size - memory,
              data: [0,current.size - memory],
              usado: 0,
            };
            var usado = {
              id: ++blockCounter,
              processo: processo,
              name: 'Processo ' + processo.pid,
              size: memory,
              data: [0,memory],
              usado: memory,
            };
            /** atualizando as referências **/
            if(mergeFit.memory.blocks[index - 1]){
              mergeFit.memory.blocks[index - 1].proximo = usado;
            }
            usado.proximo = livre;
            livre.proximo = mergeFit.memory.blocks[index];
            mergeFit.memory.blocks.splice(index,0,livre);
            mergeFit.memory.blocks.splice(index,0,usado);
            alocado = true;
            lastBlockProcess[processo.pid] = usado;
            return usado;
          }else{
            /** só aloca quando for o tamanho **/
            current.processo = processo;
            current.name = 'Processo ' + processo.pid;
            current.usado = memory < current.size ? memory : current.size;
            lastBlockProcess[processo.pid] = current;
            alocado = true;
            return current;
          }
        }
        return self.next;
      })(processo,current,index);
    }

    var lastBlockProcess = [];
    mergeFit.aumentarMemoria = function(processo){
      var newSize = MemoryHelper.random(2,32);
      if(newSize > mergeFit.memory.size){
        processo.state = 'Abortado';
      }

      /** recupera o ultimo bloco alocado **/
      var bloco = lastBlockProcess[processo.pid];
      if(processo.state != 'Abortado'){
        if((bloco.usado + newSize) > bloco.size){
          if((bloco.size - bloco.usado) > 0){
            var remaining = newSize - bloco.size;
            bloco.usado = bloco.size;
            bloco = mergeFit.split(processo,newSize - bloco.size,this.memory.blocks[0],0);
          }else{
            bloco = mergeFit.split(processo,newSize,this.memory.blocks[0],0);
          }
          if(!bloco) processo.state = 'Abortado';
        }

        if(!bloco || processo.state == 'Abortado'){
          debugger;
          return false;
        }
        processo.memory += newSize;
        mergeFit.memory.size -= newSize;
        alocado = false;
      }

      if(processo.state == 'Abortado'){
        mergeFit.encerrarProcesso(processo,mergeFit.memory.blocks[0],0);
      }

      return processo.state != 'Abortado';
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
          /** merge **/
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
        }
        return mergeFit.memory.blocks[index];
      })(processo,block,index);
    }

    mergeFit.encerrarProcesso = function(processo,block,index){
      this.memory.size += processo.memory;
      this.merge(processo,this.memory.blocks[0],0);
    };

    return mergeFit;
});
