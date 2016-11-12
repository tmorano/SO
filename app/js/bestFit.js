sistemasOperacionais.factory('BestFitService', function (MemoryHelper) {
    var bestFit = {};
    var sortedBlocks = [];
    var tamblock = 0;

    bestFit.desfazerAlocacoes = function(blocks){
      blocks.forEach(function(block){
        block.processo = null;
        block.name = 'DISPONIVEL';
      });
    }

    /*
    * Adiciona um processo ou aloca mais memória para ele
    */
    bestFit.add = function(processo,newSize){
      // pega o novo tamanho (se for só aumentar) ou o tamanho do novo processo
      var size = newSize || processo.memory;

      /** ordena para conseguir o melhor bloco **/
      sortedBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
      var bestFitBlock;
      for(var i = 0;i < sortedBlocks.length; i++){
        if(!sortedBlocks[i].processo && sortedBlocks[i].size >= size){
          bestFitBlock = sortedBlocks[i];
        }
      }

      /** não encontrou um bloco **/
      if(!bestFitBlock){

        /** caso o tamanho ultrapasse os limites da memória e não foi possível encontrar um bloco apropriado **/
        if((tamblock + size) > this.memory.totalSize){
          processo.state = 'Abortado';
          return;
        }
        var block = {
          id: this.memory.blocks.length,
          processo: processo,
          size: size,
          data: [0,size],
          name: 'Processo ' + processo.pid
        };
        /** incrementa a quantidade total de blocos criados **/
        tamblock += size;
        this.memory.blocks.push(block);
        this.config.arrayOfProcessMemory.series.push(block);
        /** lista auxiliar de blocos ordenados pelo tamanho **/
        sortedBlocks.push(block);
      }else{
        /** se encontrou um bloco aloca ele **/
        bestFitBlock.name = 'Processo ' + processo.pid;
        bestFitBlock.processo = processo;
      }
      /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
       do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
      **/
      this.memory.size -= (newSize || processo.memory);
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
      }else{
        /** só aloca a nova memória se tiver espaço **/
        var processBlock = MemoryHelper.indexOfBlock(processo.pid);
        if(processBlock.size < newSize){
          this.add(processo,newSize);
        }
      }

      if(processo.state != 'Abortado'){
        /** se não tiver sido abortado,incrementa o tamanho da memória do processo **/
        processo.memory += newSize;
      }else{
        /** procura ainda blocos que estiver alocado com o processo abortado e os libera **/
        this.desfazerAlocacoes(this.memory.blocks.filter(function(block){ return block.processo && block.processo.pid == processo.pid }));
        this.config.totalMemory = this.memory.size += processo.memory;
      }
      /** este método deve retornar true para uma alocação bem sucedida **/
      return processo.state != 'Abortado';
    };

    bestFit.encerrarProcesso = function(processo){
      MemoryHelper.encerrarProcesso(processo,this);
    };

    return bestFit;
});
