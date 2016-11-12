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
      var orderedBlocks = sortedBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
      var bestFitBlock;
      for(var i = 0;i < orderedBlocks.length; i++){
        if(!orderedBlocks[i].processo && orderedBlocks[i].size >= size){
          bestFitBlock = orderedBlocks[i];
        }
      }

      /** não encontrou um bloco **/
      if(!bestFitBlock){

        var changed = [];
        /** procura blocos livres pra alocar **/
        for(var i = 0;i < this.memory.blocks.length; i++){
          if(this.memory.blocks[i].processo || size <= 0) continue;
          this.memory.blocks[i].processo = processo;
          this.memory.blocks[i].name = 'Processo ' + processo.pid;
          size -= this.memory.blocks[i].size;
          changed.push(this.memory.blocks[i]);
        }

        /** se não achar ou se ainda sobrar o que tiver de alocar **/
        if(size > 0){

          /** impedir que seja criado um novo bloco fora do tamanho da memória  **/
          if((tamblock + size) > this.memory.totalSize){
            /** desfaz alocações feitas **/
            this.desfazerAlocacoes(changed);
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
      }else{
        /** só aloca a nova memória se tiver espaço **/
        this.add(processo,newSize);
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
