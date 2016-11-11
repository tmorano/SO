sistemasOperacionais.factory('BestFitService', function (MemoryHelper) {
    var bestFit = {};
    var sortedBlocks = [];

    bestFit.add = function(processo,newSize){
      // pega o novo tamanho (se for só aumentar) ou o tamanho do novo processo
      var size = newSize || processo.memory;

      /** ordena para conseguir o melhor bloco **/
      var orderedBlocks = sortedBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
      var bestFitBlock;
      for(var i = 0;i < orderedBlocks.length; i++){
        if(!orderedBlocks[i].processo && orderedBlocks[i].size >= size){
          bestFitBlock = orderedBlocks[i];
        }
      }

      /** não encontrou um bloco **/
      if(!bestFitBlock){

        /** procura blocos livres pra alocar **/
        for(var i = 0;i < this.memory.blocks.length && size > 0; i++){
          if(this.memory.blocks[i].processo) continue;
          this.memory.blocks[i].processo = processo;
          this.memory.blocks[i].name = 'Processo ' + processo.pid;
          size -= this.memory.blocks[i].size;
        }

        /** se não achar ou se ainda sobrar o que tiver de alocar **/
        if(size > 0){
          var block = {
            id: this.memory.blocks.length,
            processo: processo,
            size: size,
            data: [0,size],
            name: 'Processo ' + processo.pid
          };
          this.memory.blocks.push(block);
          this.config.arrayOfProcessMemory.series.push(block);
          /** bloco auxiliar de blocos ordenados pelo tamanho **/
          sortedBlocks.push(block);
        };

      }else{
        /** se encontrou um bloco aloca ele **/
        bestFitBlock.name = 'Processo ' + processo.pid;
        bestFitBlock.processo = processo;
      }
      /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
       do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
      **/
      this.memory.size = this.config.totalMemory -= (newSize || processo.memory);
    }

    bestFit.adicionarNaMemoria = function (processo) {
      if(MemoryHelper.isAlocado(processo)) return;

      if(MemoryHelper.isFull(processo.memory)){
        console.log('Processo ',processo.pid,' foi abortado ');
        processo.state = 'Abortado';
        return;
      }

      this.add(processo);
    };

    bestFit.aumentarMemoria = function(processo){
      var newSize = MemoryHelper.random(2,128);
      /** Verifica se o novo tamanho pode ser alocado **/
      if(MemoryHelper.isFull(newSize)){
        processo.state = 'Abortado';
        /** desaloca **/
        this.memory.blocks.forEach(function(block){
          if(block.processo && block.processo.pid == processo.pid){
            block.name = 'DISPONIVEL';
            block.processo = null;
          }
        });
        this.config.totalMemory = this.memory.size += processo.memory;
        return false;
      }
      processo.memory += newSize;
      this.add(processo,newSize);
      return true;
    };

    bestFit.encerrarProcesso = function(processo){
      MemoryHelper.encerrarProcesso(processo,this);
    };

    return bestFit;
});
