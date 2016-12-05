sistemasOperacionais.factory('MemorySwappingService', function (MemoryHelper) {
    var virtualMemory = {};
    virtualMemory.blocks = [];
    var sortedVirtualBlocks = [];
    var processToRemove = {};

    virtualMemory.swap = function (memoryService,processToSwap) {

        if(processToSwap){
            memoryService.config.arrayOfProcessMemory.series.forEach(function(block){
                if(block.isVirtual && block.processo && block.processo.pid == processToSwap.pid){
                    block.processo = null;
                    block.usado = 0;
                    block.name = 'DISPONIVEL';
                }
            });
        }

        //Vamos verificar o espaço da memoria está abaixo de 70%
        var memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);



        if(memoryUsage > 70){
            // Realizar o swap dos processos aguardando, iniciar pelo ultimo da fila de prioridades
            //Percorrer todas as filas de prioridade do round robin

            var processos = [];
            memoryService.config.filaDePrioridade.forEach(function(fila){
                for(var j = fila.length-1; j>0; j--){
                    var proc = fila[j];
                    if(proc.state == 'Aguardando'){
                        processos.push(proc);
                    }
                }
            });

            processos.forEach(function(processo){
                memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
                if(!processo.isSwapped && memoryUsage > 70){
                    processToRemove = processo;
                    processToRemove.isSwapped = true;
                    memoryService.encerrarProcesso(processo);
                    virtualMemory.blocks = [];
                    /**Com o processo encontrado vamos adicionar no HD utilizando o bestfit **/
                    /** ordena para conseguir o melhor bloco **/
                    sortedVirtualBlocks.sort(function(blockA,blockB){ return blockB.size - blockA.size; });
                    var bestFitBlock;
                    for(var i = 0;i < sortedVirtualBlocks.length; i++){
                        if(!sortedVirtualBlocks[i].processo && sortedVirtualBlocks[i].size >= processToRemove.size){
                            bestFitBlock = sortedVirtualBlocks[i];
                        }
                    }
                    /** não encontrou um bloco **/
                    if(!bestFitBlock){

                        var block = {
                            id: memoryService.memory.blocks.length + 1,
                            isVirtual: true,
                            processo: processToRemove,
                            size: processToRemove.memory,
                            data: [0,processToRemove.memory],
                            name: 'Processo ' + processToRemove.pid,
                            usado: processToRemove.memory,
                        };
                        /** incrementa a quantidade total de blocos criados **/
                        virtualMemory.blocks.push(block);
                        bestFitBlock = block;
                        /** lista auxiliar de blocos ordenados pelo tamanho **/
                        sortedVirtualBlocks.push(block);
                        memoryService.config.arrayOfProcessMemory.series.push(block);
                    }else{
                        /** se encontrou um bloco aloca ele **/
                        bestFitBlock.name = 'Processo ' + processToRemove.pid;
                        bestFitBlock.processo = processToRemove;
                        bestFitBlock.usado = processToRemove.memory < bestFitBlock.size ? processToRemove.memory : bestFitBlock.size;
                    }
                }
            });
        }else{

            var processos = [];
            memoryService.config.filaDePrioridade.forEach(function(fila){
                processos = processos.concat( fila.filter(function(processo){
                        return processo.state == 'Aguardando';
                    })
                    .sort(function(a,b){
                        return b.tempoExecutado - a.tempoExecutado;
                    })
                    .sort(function(a,b){
                        return a.prioridade - b.prioridade;
                    }) );
            });

        }
    }
    return virtualMemory;
});