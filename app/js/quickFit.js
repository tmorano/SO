sistemasOperacionais.factory('QuickFitService', function (MemoryHelper, $filter) {
  var quickFit = {};
  quickFit.rec = 0;
  quickFit.ocorrencias = [];
  quickFit.sortedBlocks = [];
  var tamblock = 0;

  quickFit.desfazerAlocacoes = function(blocks){
    blocks.forEach(function(block){
      block.processo = null;
      block.name = 'DISPONIVEL';
      if(quickFit.memory.quickBlocks){
        //Sincronizando com o quickBlocks
        for(var i =1 ; i <=5; i++){
          var viewBlock = $filter('getById')(quickFit.memory.quickBlocks[i].blocks, block.id);
          if(viewBlock){
            viewBlock.processo = null;
            viewBlock.name = 'DISPONIVEL';
          }
        }
      }
    });
  }

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
    if(quickFit.memory.quickBlocks){
      // Buscar no array do quickFit pelo tamanho do processo
      var blockNum = 0;
      quickFit.memory.quickBlocks.forEach(function (eachBlock) {
        if(eachBlock.size == size){
          eachBlock.blocks.every(function (block) {
            if(block.processo == undefined){
              var viewBlock = $filter('getById')(quickFit.memory.blocks, block.id);
              quickFitBlock = viewBlock;
              viewBlock.processo = processo;
              viewBlock.name = 'Processo ' + processo.pid;
              //Adicionando no bloco quickBlocks
              block.processo = processo;
              block.name = 'Processo ' + processo.pid;
              return false;
            }else{
              return true;
            }
          });
          if(!quickFitBlock){
            //Verificando se eh possivel adicionar um novo bloco:
            if(!((tamblock + size) > quickFit.memory.totalSize)){
              //Bloco de tamanho definido nao foi encontrado, criando novo bloco:
              var newBlock = {
                id: quickFit.memory.blocks.length,
                processo: processo,
                size: size,
                data: [0,size],
                name: 'Processo ' + processo.pid
              };
              quickFitBlock = newBlock;
              tamblock += size;
              quickFit.memory.quickBlocks[blockNum+1].blocks.push(newBlock);
              quickFit.memory.blocks.push(newBlock);
              quickFit.config.arrayOfProcessMemory.series.push(newBlock);
              /** bloco auxiliar de blocos ordenados pelo tamanho **/
              quickFit.sortedBlocks.push(newBlock);
            }
          }
        }
        blockNum++;
      });
      if(!quickFitBlock){
        // Bloco nao foi encontrado, procurar nos bloco "OUTROS"
        quickFit.memory.quickBlocks[5].blocks.every(function (block) {
          //Procurando bloco com tamanho ideal ou com tamanho maior que o do processo (Fragmentação interna):
          if(block.size >= size && block.processo == undefined){
            var viewBlock = $filter('getById')(quickFit.memory.blocks, block.id);
            quickFitBlock = viewBlock;
            viewBlock.processo = processo;
            viewBlock.name = 'Processo ' + processo.pid;
            //Adicionando no bloco quickBlocks
            block.processo = processo;
            block.name = 'Processo ' + processo.pid;
            return false;
          }else{
            return true;
          }
        });
        if(!quickFitBlock){
          //Verificando se eh possivel adicionar um novo bloco:
          if(!((tamblock + size) > this.memory.totalSize)){
            //Bloco de tamanho definido nao foi encontrado, criando novo bloco:
            var block = {
              id: this.memory.blocks.length,
              processo: processo,
              size: size,
              data: [0,size],
              name: 'Processo ' + processo.pid
            };
            tamblock += size;
            quickFit.memory.quickBlocks[5].blocks.push(block);
            this.memory.blocks.push(block);
            this.config.arrayOfProcessMemory.series.push(block);
            /** bloco auxiliar de blocos ordenados pelo tamanho **/
            quickFit.sortedBlocks.push(block);
          }else{
            //Procura algum bloco livre nas outras listas
            quickFit.memory.quickBlocks.forEach(function (eachBlock) {
              if(eachBlock.size >= size){
                eachBlock.blocks.every(function (block) {
                  if(block.processo == undefined){
                    var viewBlock = $filter('getById')(quickFit.memory.blocks, block.id);
                    quickFitBlock = viewBlock;
                    viewBlock.processo = processo;
                    viewBlock.name = 'Processo ' + processo.pid;
                    //Adicionando no bloco quickBlocks
                    block.processo = processo;
                    block.name = 'Processo ' + processo.pid;
                    return false;
                  }else{
                    return true;
                  }
                })
              }
            });
            // Nenhum bloco encontrado,  abortando processo
            if(!quickFitBlock){
              processo.state = 'Abortado';
              return;
            }
          }
        }

      }
      /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
       do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
       **/
      this.memory.size -= (newSize || processo.memory);

    }else{
      //Mesmo processo do beestFit
      // pega o novo tamanho (se for só aumentar) ou o tamanho do novo processo
      var size = newSize || processo.memory;

      /** ordena para conseguir o melhor bloco **/
      quickFit.sortedBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
      var bestFitBlock;
      for(var i = 0;i < quickFit.sortedBlocks.length; i++){
        if(!quickFit.sortedBlocks[i].processo && quickFit.sortedBlocks[i].size >= size){
          bestFitBlock = quickFit.sortedBlocks[i];
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
          data: [size,0],
          name: 'Processo ' + processo.pid
        };
        /** incrementa a quantidade total de blocos criados **/
        tamblock += size;
        this.memory.blocks.push(block);
        this.config.arrayOfProcessMemory.series.push(block);
        /** lista auxiliar de blocos ordenados pelo tamanho **/
        quickFit.sortedBlocks.push(block);
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

  quickFit.ajustarBlocos = function(){
    //Verificar os TOP 4
    quickFit.memory.quickBlocks = [];

    var ocorrencias = angular.copy(quickFit.ocorrencias);

    var topKeys =  ocorrencias.sort(function (ocorrenciaA, ocorrenciaB) {
      return ocorrenciaB.ocorrencias - ocorrenciaA.ocorrencias;
    });

    var orderedBlocks = angular.copy(quickFit.sortedBlocks.sort(function(blockA,blockB){
      return blockB.size - blockA.size;
    }));

    var count = 1;
    topKeys.forEach(function (eachKey) {
      //Buscar bloco de memoria com key e inserir no quickBlocks
      // Para os 4 primeiros, vou colocar um tamanho especifico
      for(var i = 0;i < orderedBlocks.length; i++){
        if(count <= 4){
          if(orderedBlocks[i].size == eachKey.size && !orderedBlocks[i].inserted){
            if(quickFit.memory.quickBlocks[count]){
              quickFit.memory.quickBlocks[count].blocks.push(orderedBlocks[i]);
              //Para cada bloco que adicionei no quickBlocks removo do OrderedBlocks para nao inseri-lo novamente.
              orderedBlocks[i].inserted = true;
            }else{
              quickFit.memory.quickBlocks[count] = {
                blocks: [orderedBlocks[i]],
                size : orderedBlocks[i].size

              };

              orderedBlocks[i].inserted = true;
            }

          }
        }else{
          //Para o restante, vou adicionar todos os outros tamanhos (Array: Outros)
          if(!orderedBlocks[i].inserted){
            if(quickFit.memory.quickBlocks[5]){
              quickFit.memory.quickBlocks[5].blocks.push(orderedBlocks[i]);
              orderedBlocks[i].inserted = true;
            }else{
              quickFit.memory.quickBlocks[5] = {
                blocks: [orderedBlocks[i]],
                size : orderedBlocks[i].size
              };
              orderedBlocks[i].inserted = true;
            }
          }
        }
      }
      if(quickFit.memory.quickBlocks[count]){
        count++;
      }
    })

  }

  quickFit.encerrarProcesso = function(processo){
    MemoryHelper.encerrarProcesso(processo,this);
  };

  return quickFit;
});
