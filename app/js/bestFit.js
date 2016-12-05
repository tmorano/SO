sistemasOperacionais.factory('BestFitService', function (MemoryHelper) {
    var bestFit = {};
    var sortedBlocks = [];
    var tamblock = 0;
    var lastBlockProcess = [];
    var internalSize = 1024;

  /*
   * Adiciona um processo ou aloca mais memória para ele
   */
    bestFit.add = function(processo,newSize){
        (function(processo){
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
                if((tamblock + size) > bestFit.memory.totalSize){
                    processo.state = 'Abortado';
                    return;
                }
                var block = {
                    id: bestFit.memory.blocks.length,
                    processo: processo,
                    size: size,
                    data: [0,size],
                    name: 'Processo ' + processo.pid,
                    usado: size,
                };
                /** incrementa a quantidade total de blocos criados **/
                tamblock += size;
                bestFit.memory.blocks.push(block);
                bestFitBlock = block;
                /** lista auxiliar de blocos ordenados pelo tamanho **/
                sortedBlocks.push(block);
            }else{
                /** se encontrou um bloco aloca ele **/
                bestFitBlock.name = 'Processo ' + processo.pid;
                bestFitBlock.processo = processo;
                bestFitBlock.usado = size < bestFitBlock.size ? size : bestFitBlock.size;
            }

            /** ultimo bloco desse processo **/
            lastBlockProcess[processo.pid] = bestFitBlock;
            /** decrementa do tamanho total o novo tamanho (pediu mais memória) ou o tamanho
             do novo processo. Quando newSize <> undefined é uma requisição por mais memória.
             **/
            bestFit.memory.size -= size;
            internalSize -= size;
            if(bestFit.memory.size !== internalSize){
                debugger;
            }
        })(processo);
    }

    bestFit.adicionarNaMemoria = function (processo) {
        (function(processo){
            if(bestFit.config.arrayOfProcessMemory.series.length == 0){
                bestFit.config.arrayOfProcessMemory.series = bestFit.memory.blocks;
            }
            if(processo.state != 'Pronto' || processo.state == 'Abortado') return;

            if(processo.memory > bestFit.memory.size){
                processo.state = 'Abortado';
                return;
            }
            bestFit.add(processo);
        })(processo);
    };

    bestFit.aumentarMemoria = function(processo){
        return (function(processo){
            var newSize = MemoryHelper.random(2,32);
            if(newSize > bestFit.memory.size){
                processo.state = 'Abortado';
            }

            var bloco = lastBlockProcess[processo.pid];
            if(processo.state != 'Abortado'){
                if((bloco.usado + newSize) > bloco.size){
                    if((bloco.size - bloco.usado) > 0){
                        var remaining = newSize - bloco.size;
                        bloco.usado = bloco.size;
                        bestFit.add(processo,newSize - bloco.usado);
                    }else{
                        bestFit.add(processo,newSize);
                    }
                }else{
                    /** ainda pode expandir dentro do bloco **/
                    bloco.usado += newSize;
                    bestFit.memory.size -= newSize;
                    internalSize -= newSize;
                }
            }

            /** se abortou por que não conseguiu alocar ou encaixar em um bloco **/
            if(processo.state == 'Abortado'){
                bestFit.encerrarProcesso(processo);
            }else{
                processo.memory += newSize;
            }

            return processo.state != 'Abortado';
        })(processo);
    };

    var contador = 0;
    bestFit.encerrarProcesso = function(processo){
        ((function(processo){
            var encontrado = false;
            for(var i = 0; i < bestFit.memory.blocks.length;i++){
                if(bestFit.memory.blocks[i].processo && bestFit.memory.blocks[i].processo.pid == processo.pid){
                    encontrado = true;
                    break;
                }
            }
            if(!encontrado){
                debugger;
            }
            bestFit.memory.size += processo.memory;
            contador += processo.memory;
            if(contador > 1024){
                debugger;
            }
            internalSize += processo.memory;
            console.log('destruiu processo c/ memoria e pid',processo.memory,processo.pid)
            for(var i = 0; i < bestFit.memory.blocks.length;i++){
                if(bestFit.memory.blocks[i].processo && bestFit.memory.blocks[i].processo.pid == processo.pid){
                    bestFit.memory.blocks[i].processo = null;
                    bestFit.memory.blocks[i].name = 'DISPONIVEL';
                    bestFit.memory.blocks[i].usado = 0;
                }
            }
        }))(processo);

        // MemoryHelper.encerrarProcesso(processo,this);
        // console.log(processo);
        // console.log(bestFit.memory.size);
        // var livre = true;
        // for(var i = 0;i < bestFit.memory.blocks.length;i++){
        //   if(bestFit.memory.blocks[i].processo){
        //     livre = false;
        //     break;
        //   }
        // }
        // // TODO: fix this
        // if(livre && bestFit.memory.size != 1024){
        //    bestFit.memory.size = 1024;
        // }
    };

    return bestFit;
});