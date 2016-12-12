sistemasOperacionais.factory('BestFitService', function(MemoryHelper){
  var bestFit = {};
  var blockCount = 0;
  var totalMemoryBlock = 0;
  var lastBlockProcess = [];

  var sortedBlocks = [];

  bestFit.add = function(processo,size,expand){
    var bestFitBlock = null;
    var memory = size || processo.memory;

    sortedBlocks.sort(function(a,b){
      return a.size - b.size;
    });

    for(var i = 0;i < sortedBlocks.length;i++){
      if(sortedBlocks[i].size >= memory && !sortedBlocks[i].processo){
        bestFitBlock = sortedBlocks[i];
        break;
      }
    }

    if(!bestFitBlock){
      if((totalMemoryBlock + memory) > bestFit.memory.totalSize){
        console.log('nao achou espaco pra alocar ',processo.pid)
        return null;
      }

      var block = {
        id: ++blockCount,
        processo: processo,
        size: memory,
        data: [memory,0],
        usado: memory,
        name: 'Processo ' + processo.pid
      };
      bestFitBlock = block;
      totalMemoryBlock += memory;
      sortedBlocks.push(bestFitBlock);
      bestFit.memory.blocks.push(bestFitBlock);
    }else{
      bestFitBlock.processo = processo;
      bestFitBlock.name = 'Processo ' + processo.pid;
      if(memory > bestFitBlock.size){
        //debugger;
      }
      bestFitBlock.usado = memory;
    }
    lastBlockProcess[processo.pid] = bestFitBlock;
    bestFit.memory.size -= bestFitBlock.usado;
    if(expand){
      if(expand > bestFit.memory.size){
        //debugger;
      }
      bestFit.memory.size -= expand;
    }
    return bestFitBlock;
  }

  bestFit.adicionarNaMemoria = function(processo){
    if(processo.state != 'Pronto') return;
    if(bestFit.memory.blocks.length == 0){
      bestFit.config.arrayOfProcessMemory.series = bestFit.memory.blocks;
    }
    if(processo.memory > bestFit.memory.totalSize){
      processo.state = 'Abortado';
      //debugger;
      return false;
    }
    if(processo.memory > bestFit.memory.size){
      // //debugger;
    }

    var block = bestFit.add(processo);

    if(!block){
      // //debugger;
      processo.state = 'Abortado';
      return false;
    }

    return true;
  }

  bestFit.encerrarProcesso = function(processo){
    for(var i = 0;i < bestFit.memory.blocks.length;i++){
      if(bestFit.memory.blocks[i].processo &&
        bestFit.memory.blocks[i].processo.pid == processo.pid){
          if(bestFit.memory.blocks[i].usado > bestFit.memory.blocks[i].size){
            //debugger;
          }
          bestFit.memory.blocks[i].processo = null;
          bestFit.memory.blocks[i].name = 'DISPONIVEL';
          bestFit.memory.size += bestFit.memory.blocks[i].usado;
          bestFit.memory.blocks[i].usado = 0;
        }
    }
  }

  bestFit.aumentarMemoria = function(processo){
    var lastBlock = lastBlockProcess[processo.pid];
    var size = MemoryHelper.random(2,32);
    var block;

    // 58
    // 28
    // 32
    if((size + lastBlock.usado) > lastBlock.size){
      if(size > bestFit.memory.size){
        //debugger;
      }
      var remaining = lastBlock.size - (lastBlock.usado + size);
      if(remaining < 0 && Math.abs(remaining) != size){
        if((size + remaining) < 0){
          //debugger;
        }else{
          //debugger;
        }
        block = bestFit.add(processo,Math.abs(remaining),size + remaining);
        if(block){
          lastBlock.usado = lastBlock.size;
          //debugger;
        }
      }else if(Math.abs(remaining) == size){
        block = bestFit.add(processo,size);
      }else{
        //debugger;
      }
    }else{
      if(size > bestFit.memory.size){
        //debugger;
      }
      lastBlock.usado += size;
      bestFit.memory.size -= size;
      block = lastBlock;
    }
    if(!block || processo.state == 'Abortado'){
      processo.state = 'Abortado';
      bestFit.encerrarProcesso(processo);
      return false;
    }else{
      processo.memory += size;
    }
    // var oldSize = 0;
    // var block = null;
    // oldSize = lastBlock.usado;
    //
    //
    // lastBlock.usado += size;
    //
    // var remaining = lastBlock.size - lastBlock.usado;
    // if(remaining >= 0){
    //   if(size > bestFit.memory.size){
    //     //debugger;
    //   }
    //   block = lastBlock;
    //   bestFit.memory.size -= size;
    // }else if(remaining < 0){
    //   remaining *= -1;
    //   lastBlock.usado = lastBlock.size;
    //   block = bestFit.add(processo,remaining);
    // }
    //
    // if(!block){
    //   processo.state = 'Abortado';
    //   lastBlock.usado = oldSize;
    //   bestFit.encerrarProcesso(processo);
    //   return false;
    // }else{
    //   processo.memory += size;
    // }
    // return true;


  }

  return bestFit;
})
