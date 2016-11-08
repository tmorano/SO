sistemasOperacionais.service('QuickFitService',QuickFitService);


function QuickFitService(MemoryHelper){

  var blockListBySize = [];

  var ocorrencias = [];

  this.req = 0;

  this.adicionarNaMemoria = function(processo){

    var isAlocado = MemoryHelper.isAlocado(processo);

    if(isAlocado) return;

    if(MemoryHelper.isFull(processo.memory)){
      processo.state = 'Abortado';
      console.log('Processo abortado: Memória Cheia','Memória Total: ' + this.memory.size,' Memória do Processo: ' + processo.memory);
      return false;
    }

    var found = false;
    var newBlock = {
      size: processo.memory,
      processo: processo,
      id: this.memory.blocks.length,
      data: [[0, processo.memory]],
      name: 'Processo ' + processo.pid
    };
    if(blockListBySize[processo.memory]){
      found = !blockListBySize[processo.memory].every(function(block){
        if(!block.processo){
           block.processo = processo,
           block.name = 'Processo ' + processo.pid;
           return false;
        }else{
          return true;
        }
      });
      // bloco pode estar em "outra" lista
      if(!found){
        var orderedOthers = blockListBySize[0].sort(function(a,b){return b.size - a.size});
        found = orderedOthers.every(function(block){
          // como é o a lista dos blocos restante vê se o bloco tem memoria
          if(!block.processo && processo.memory >= block.size ){
             block.processo = processo,
             block.name = 'Processo ' + processo.pid;
             return false;
          }else{
            return true;
          }
        })
      }
    }

    if(blockListBySize.length == 0 || !found){
      this.memory.blocks.push(newBlock);

      // se nao tiver a ocorrencia cria
      if(!ocorrencias[newBlock.size]) ocorrencias[newBlock.size] = 0;
      // contando a proxima ocorrencia
      ocorrencias[newBlock.size]++;

      this.config.arrayOfProcessMemory.series.push(newBlock);
      this.memory.size -= processo.memory;
      this.config.totalMemory -= processo.memory;
      this.memory.req++;
    }

  };

  this.aumentarMemoria = function(processo) {
    var oldSize = processo.memory;
    var newSize = MemoryHelper.random(2,128);
    if(MemoryHelper.isFull(newSize)){
      processo.state = 'Abortado';
      console.log('Processo abortado: Memória Cheia','Memória Total: ' + this.memory.size,' Memória do Processo: ' + processo.memory);
      return false;
    }

    processo.memory =+ newSize;

    var lista = this.memory.blocks;

    var indexBlock = MemoryHelper.indexOf(lista,processo);
    var nextBlocks = lista.splice(indexBlock + 1,lista.length);
    var changedBlocks = [];
    var remainingMemory = newSize;
    var erro = !nextBlocks.every(function(block){
      if(remainingMemory <= 0 || block.processo){
        return false;
      }
      if(!block.processo){
        if(!ocorrencia[oldSize]) ocorrencia[oldSize]--;
        if(!ocorrencia[newSize]) ocorrencia[newSize] = 0;
        ocorrencia[newSize]++;
        block.processo = processo;
        block.name = 'Processo ' + processo.pid,
        remainingMemory -= block.size;
        changedBlocks.push(block);
      }
      return true;
    });

     // desfazer alterações
     if(erro){
       changedBlocks.forEach(function (block){
         block.processo = null;
       });
       processo.state = 'Abortado';
       console.log('Problema na alocação do processo ' + processo.pid + ' abortado.');
       return false;
     }else{
       this.memory.size -= processo.memory;
       this.config.totalMemory -= newSize;
       return true;
     }
  };

  this.encerrarProcesso = function(processo){
    MemoryHelper.encerrarProcesso(processo,this);
  };

  this.processaOcorrencias = function(){
    var _ = [];
    ocorrencias.forEach(function(valor,tamanho){
      _.push({ocorrencias: valor * 100 / this.memory.blocks.length, tamanho: tamanho});
    });
    _ = _.sort(function(a,b){ return b.ocorrencias - a.ocorrencias });
    var top_ = _.slice(0,5);
    var livres_ = _.slice(5,_.length);

    var sorted = [];
    top_.forEach(function (ocorrencia){
      sorted[ocorrencia.tamanho] = this.memory.blocks.filter(function(block){ return block.size == ocorrencia.tamanho });
    });

    sorted[0] = [];
    livres_.forEach(function (ocorrencia){
      sorted[0] = sorted[0].concat(this.memory.blocks.filter(function (block){ return block.size == ocorrencia.tamanho }));
    });
    var toView = [];
    var copy = sorted;
    var c = 1;
    for(var i = 0;i < copy.length; i++){
      if(!copy[i] || copy[i].length == 0) continue;
      for(var j = 0;j < copy[i].length; j++){
        copy[i][j].data = [[c,copy[i][j].size]];
        toView.push(copy[i][j]);
      }
      c++;
    }

    this.config.arrayOfProcessMemory.series = toView;
    this.config.arrayOfProcessMemory.series = this.config.arrayOfProcessMemory.series.concat(this.memory.blocks)
  };

  return this;
}
