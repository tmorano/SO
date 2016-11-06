sistemasOperacionais.service('QuickFitService',QuickFitService);


function QuickFitService(MemoryHelper){

  var blockListBySize = [];
  var rank;

  this.adicionarNaMemoria = (processo)=>{


    isAlocado = MemoryHelper.isAlocado(processo);
    isAumentouMemoria = processo.chance() && isAlocado;

    if(isAumentouMemoria){
      MemoryHelper.aumentarMemoria(processo);
    }

    if(isAlocado && !isAumentouMemoria) return;

    if(MemoryHelper.isFull(processo)){
      processo.state = 'Abortado';
      return;
    }

    if(this.memory.blocks.length % 100 == 0){
      blockListBySize = this.processaOcorrencias();
    }

    // quando já processou as ocorrencias;
    if(blockListBySize[processo.memory]){
       if(!isAumentouMemoria){
         blockListBySize[processo.memory].push(processo);
       }else{
         indexBlock = MemoryHelper.indexOf(blockListBySize,processo);
         to = blockListBySize.splice(indexBlock,blockListBySize.length);
         to.forEach((bloco)=>{

         })
       }
    }
    // adiciona inicialmente na lista de "livres"
    else{
       blockListBySize[0].push(processo);
    }

    this.memory.blocks.push({
      size: processo.memory,
      processo: processo,
    })
  }

  this.processaOcorrencias = ()=>{
    blocosOrdenados = this.blockListBySize.map((blocos)=>{
      return (blocos.length * 100) / this.memory.blocks.length;
    }).sort((a,b)=>{ return b - a; });
    blocosPrincipais = blocosOrdenados.splice(0,5);
    blocosRestantes = blocosOrdenados.splice(5,blocosOrdenados.length);
    blocosPrincipais[0] = blocosRestantes;
    return blocosPrincipais;
  }

  return this;
}
