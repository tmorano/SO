sistemasOperacionais.factory('MergeFitService', function (MemoryHelper) {
    var mergeFit = {};
    var sortedBlocks = [];
    var tamblock = 0;

    mergeFit.desfazerAlocacoes = function(blocks){
      blocks.forEach(function(block){
        block.processo = null;
        block.name = 'DISPONIVEL';
      });
    }

    mergeFit.adicionarNaMemoria = function (processo) {
      if(MemoryHelper.isAlocado(processo)) return;

      if(this.memory.blocks.length == 0){
        var blockA,blockB;
        blockA = {
          id: 0,
          processo: processo,
          name: 'Processo ' + processo.pid,
          size: processo.memory,
          data: [0,processo.memory]
        };
        blockB = {
          id: 1,
          processo: null,
          name: 'DISPONIVEL',
          size: this.memory.totalSize - processo.memory,
          data: [0,this.memory.totalSize - processo.memory]
        };
        this.memory.blocks.push(blockA,blockB);
        this.config.arrayOfProcessMemory.series = this.memory.blocks;
      }else{
        this.split(processo);
      }

      this.config.totalMemory = this.memory.size -= processo.memory
    };

    mergeFit.split = function(processo,current,index){
      var block;
      if(current && !current.processo) return this.memory.blocks.splice(index,1)[0];
      else if(current) return;
      for(var i = 0; i < this.memory.blocks.length; i++){
        block = this.split(processo,this.memory.blocks[i],i);
        if(!block) continue;
        var splittedBlock = {
          id: this.memory.blocks.length,
          processo: processo,
          name: 'Processo ' + processo.pid,
          size: processo.memory,
          data: [0,processo.memory]
        };
        var remainingSplitted = {
          id: this.memory.blocks.length + 1,
          processo: null,
          name: 'DISPONIVEL',
          size: block.size - processo.memory,
          data: [0,block.size - processo.memory]
        }
        this.memory.blocks.splice(i,1,splittedBlock);
        this.memory.blocks.splice(i+1,1,remainingSplitted);
        return;
      }
    }

    mergeFit.aumentarMemoria = function(processo){

    };

    mergeFit.encerrarProcesso = function(processo){
      var blockIndexes = [],size = this.memory.blocks[this.memory.blocks.length - 1].size;
      for(var i = 0;i < this.memory.blocks.length;i++){
        if(this.memory.blocks[i].processo && this.memory.blocks[i].processo.pid == processo.pid){
          size += this.memory.blocks[i].size;
          blockIndexes.push(i);
        }
      }
      blockIndexes.push(this.memory.blocks.length - 1);
      newindex = null;
      blockIndexes.forEach(function(i){
        newindex = newindex ? i - 1 : i;
        mergeFit.memory.blocks.splice(newindex,1);
        newindex = true;
      });
      this.memory.blocks.push({
        id: this.memory.blocks.length,
        name: 'DISPONIVEL',
        data: [0,size],
        size: size,
        processo: null,
      });
    };

    return mergeFit;
});
