sistemasOperacionais.factory('BestFitService', function (MemoryHelper) {
    var bestFit = {};
    var sortedBlocks = [];
    var tamblock = 0;
    var lastBlockProcess = [];

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
                data: [size,0],
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
    }

    bestFit.adicionarNaMemoria = function (processo) {
        if(bestFit.config.arrayOfProcessMemory.series.length == 0){
            bestFit.config.arrayOfProcessMemory.series = bestFit.memory.blocks;
        }
        if(processo.state != 'Pronto' && !processo.isSwapped) return;

        if(processo.memory > bestFit.memory.size){
            processo.state = 'Abortado';
            return;
        }
        bestFit.add(processo);
    };

    bestFit.aumentarMemoria = function(processo){
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
            }
        }

        /** se abortou por que não conseguiu alocar ou encaixar em um bloco **/
        if(processo.state == 'Abortado'){
            bestFit.encerrarProcesso(processo);
        }else{
            processo.memory += newSize;
            bestFit.memory.size -= newSize;
        }

        return processo.state != 'Abortado';
    };

    bestFit.encerrarProcesso = function(processo){
        MemoryHelper.encerrarProcesso(processo,this);
        var livre = true;
        for(var i = 0;i < bestFit.memory.blocks.length;i++){
            if(bestFit.memory.blocks[i].processo){
                livre = false;
                break;
            }
        }
        // TODO: fix this
        if(livre && bestFit.memory.size != this.memory.totalSize){
            bestFit.memory.size = this.memory.totalSize;
        }
    };

    return bestFit;
});