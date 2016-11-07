sistemasOperacionais.service('QuickFitService',QuickFitService);


function QuickFitService(MemoryHelper){

  var blockListBySize = [];
  var rank;

  var ocorrencias = [];

  this.req = 0;

  this.adicionarNaMemoria = (processo)=>{

    isAlocado = MemoryHelper.isAlocado(processo);

    if(isAlocado) return;

    if(MemoryHelper.isFull(processo.memory)){
      processo.state = 'Abortado';
      console.log('Processo abortado: Memória Cheia','Memória Total: ' + this.memory.size,' Memória do Processo: ' + processo.memory)
      return false;
    }

    var found = false,newBlock = {
      size: processo.memory,
      processo: processo,
      id: this.memory.blocks.length,
      data : [[0,processo.memory]],
      name: 'Processo ' + processo.pid,
    };
    if(blockListBySize[processo.memory]){
      found = !blockListBySize[processo.memory].every((block)=>{
        if(!block.processo){
           block.name = 'Processo ' + processo.pid,
           block.processo = processo;
           return false;
        }else{
          return true;
        }
      });
      // bloco pode estar em "outra" lista
      if(!found){
        orderedOthers = blockListBySize[0].sort((a,b)=>{return b.size - a.size});
        found = orderedOthers.every((block)=>{
          // como é o a lista dos blocos restante vê se o bloco tem memoria
          if(!block.processo && processo.memory >= block.size ){
             block.name = 'Processo ' + processo.pid,
             block.processo = processo;
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

  }

  this.aumentarMemoria = (processo) =>{
    oldSize = processo.memory;
    newSize = MemoryHelper.random(2,128);
    if(MemoryHelper.isFull(newSize)){
      processo.state = 'Abortado';
      console.log('Processo abortado: Memória Cheia','Memória Total: ' + this.memory.size,' Memória do Processo: ' + processo.memory)
      return false;
    }

    processo.memory =+ newSize;

    lista = this.memory.blocks;

    indexBlock = MemoryHelper.indexOf(lista,processo);
    nextBlocks = lista.splice(indexBlock + 1,lista.length);
    var changedBlocks = [];
    var remainingMemory = newSize;
    var erro = !nextBlocks.every((block)=>{
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
       changedBlocks.forEach((block)=>{
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
  }

  this.encerrarProcesso = (processo)=>{
    MemoryHelper.encerrarProcesso(processo,this);
  }

  this.processaOcorrencias = ()=>{
    _ = []
    ocorrencias.forEach((valor,tamanho)=>{
      _.push({ocorrencias: valor * 100 / this.memory.blocks.length, tamanho: tamanho});
    });
    _ = _.sort((a,b)=>{ return b.ocorrencias - a.ocorrencias });
    top_ = _.slice(0,5);
    livres_ = _.slice(5,_.length);

    sorted = [];
    top_.forEach((ocorrencia)=>{
      sorted[ocorrencia.tamanho] = this.memory.blocks.filter((block)=>{ return block.size == ocorrencia.tamanho });
    });

    sorted[0] = [];
    livres_.forEach((ocorrencia)=>{
      sorted[0] = sorted[0].concat(this.memory.blocks.filter((block)=>{ return block.size == ocorrencia.tamanho }));
    });
    toView = [];
    copy = sorted;
    c = 1;
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
  }

  return this;
}
