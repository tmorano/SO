sistemasOperacionais.factory('QuickFitService', function (MemoryHelper) {
  var quickFit = {};
  quickFit.rec = 0;
  quickFit.ocorrencias = [];

  var sortedBlocks = [];

  quickFit.add = function(processo,newSize){
    // pega o novo tamanho (se for só aumentar) ou o tamanho do novo processo
    var size = newSize || processo.memory;
    // Contagem de requisições do quick Fit
    quickFit.rec++;

    //Ocorrencias devem ser contabilizadas pra qualquer requisição, inclusive as q possam ser abortadas.
    // se nao tiver a ocorrencia cria
    if(!quickFit.ocorrencias[size]){

      quickFit.ocorrencias[size] = {
        ocorrencias : 0,
        size : size};
    }
    // contando a proxima ocorrencia
    quickFit.ocorrencias[size].ocorrencias++;

    // Verifico se ja existe o array de requisições do quick fit
    var quickFitBlock;
    if(quickFit.quickBlocks){
      // Buscar no array do quickFit pelo tamanho do processo
      quickFit.quickBlocks.forEach(function (eachBlock) {
        if(eachBlock.size == size){
          eachBlock.blocks.forEach(function (block) {
            if(block.processo == undefined){
              quickFitBlock = block;
            }
          });
          if(!quickFitBlock){
            //Bloco de tamanho definido nao foi encontrado, criando novo bloco:
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
          }
        }
      });
      if(!quickFitBlock){
        // Bloco nao foi encontrado, procurar nos bloco "OUTROS"
        quickFit.quickBlocks[5].blocks.forEach(function (block) {
          //Procurando bloco com tamanho ideal ou com tamanho maior que o do processo (Fragmentação interna):
          if(block.size >= size && block.processo == undefined){
            quickFitBlock = block;
          }
        });
        if(!quickFitBlock){
          //Nao existem blocos disponiveis, criando novo bloco:
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
        }

      }
      /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
       do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
       **/
      this.memory.size = this.config.totalMemory -= (newSize || processo.memory);

    }else{
      // Mesmo processo do BestFit
      /** ordena para conseguir o melhor bloco **/
      var orderedBlocks = sortedBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });

      for(var i = 0;i < orderedBlocks.length; i++){
        if(!orderedBlocks[i].processo && orderedBlocks[i].size >= size){
          quickFitBlock = orderedBlocks[i];
        }
      }

      /** não encontrou um bloco **/
      if(!quickFitBlock){

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
        quickFitBlock.name = 'Processo ' + processo.pid;
        quickFitBlock.processo = processo;
      }
      /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
       do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
       **/
      this.memory.size = this.config.totalMemory -= (newSize || processo.memory);
    }
  }

  quickFit.adicionarNaMemoria = function (processo) {
    if(MemoryHelper.isAlocado(processo)) return;

    if(MemoryHelper.isFull(processo.memory)){
      console.log('Processo ',processo.pid,' foi abortado ');
      processo.state = 'Abortado';
      return;
    }
    if(quickFit.rec > 20){
      this.ajustarBlocos();
      quickFit.rec = 0;
    }

    this.add(processo);
  };

  quickFit.aumentarMemoria = function(processo){
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

  quickFit.ajustarBlocos = function(){
    //Verificar os TOP 4
    quickFit.quickBlocks = [];
    var topKeys = quickFit.ocorrencias.sort(function (ocorrenciaA, ocorrenciaB) {
      return ocorrenciaB.ocorrencias - ocorrenciaA.ocorrencias;
    });

    var orderedBlocks = sortedBlocks.sort(function(blockA,blockB){
      return blockB.size - blockA.size;
    });

    var count = 1;
    topKeys.forEach(function (eachKey) {
      //Buscar bloco de memoria com key e inserir no quickBlocks
      // Para os 4 primeiros, vou colocar um tamanho especifico
      for(var i = 0;i < orderedBlocks.length; i++){
        if(count <= 4){
          if(orderedBlocks[i].size == eachKey.size){
            if(quickFit.quickBlocks[count]){
              quickFit.quickBlocks[count].blocks.push(orderedBlocks[i]);
              //Para cada bloco que adicionei no quickBlocks removo do OrderedBlocks para nao inseri-lo novamente.
              orderedBlocks.splice(orderedBlocks.indexOf(orderedBlocks[i]),1);
            }else{
              quickFit.quickBlocks[count] = {
                blocks: [orderedBlocks[i]],
                size : orderedBlocks[i].size

              };

              orderedBlocks.splice(orderedBlocks.indexOf(orderedBlocks[i]),1);
              count++;
            }

          }
        }else{
          //Para o restante, vou adicionar todos os outros tamanhos (Array: Outros)
          if(quickFit.quickBlocks[count]){
            quickFit.quickBlocks[count].blocks.push(orderedBlocks[i]);
            orderedBlocks.splice(orderedBlocks.indexOf(orderedBlocks[i]),1);
          }else{
            quickFit.quickBlocks[count] = {
              blocks: [orderedBlocks[i]],
              size : orderedBlocks[i].size
            };
            orderedBlocks.splice(orderedBlocks.indexOf(orderedBlocks[i]),1);
          }

        }
      }

    })

  }

  quickFit.encerrarProcesso = function(processo){
    MemoryHelper.encerrarProcesso(processo,this);
  };

  return quickFit;
});
