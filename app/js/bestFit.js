sistemasOperacionais.factory('BestFitService', function () {
    var bestFit = {};

    bestFit.iniciarMemoria = function (args) {
        bestFit.config = args;
        bestFit.memoryBlock = args.memoryBlock;

    }

    bestFit.adicionarNaMemoria = function (processo) {
        console.log("Adicionando processo na Memoria");
        var memoryAllocated = false;
        //Verificando no MemoryBlock se existe algum espaço com encaixe e livre
        bestFit.memoryBlock.forEach(function (eachBlock) {
            if(eachBlock.tamanho == processo.memory && eachBlock.processo == undefined){
                eachBlock.processo = processo;
                bestFit.config.totalMemory -= processo.memory;
                memoryAllocated = true;
            }else if(eachBlock.processo.pid == processo.pid){
                memoryAllocated = true;
            }
        })
        // Criar novo bloco caso nao encontre
        if(!memoryAllocated) {
            // verificar a disponibilidade de memoria e core para o novo bloco
            if (bestFit.config.totalMemory > processo.memory) {
                var newBlock = {
                    tamanho: processo.memory,
                    processo: processo
                }
                bestFit.memoryBlock.push(newBlock);
                bestFit.config.totalMemory -= processo.memory;
            }else{
                // Abortar processo
                processo.state = 'Abortado';
            }
        }
    }

    bestFit.encerrarProcesso = function(processo){
        console.log("Devolvendo memoria");
        bestFit.memoryBlock.forEach(function (eachBlock) {
            if(eachBlock.processo.pid == processo.pid){
                eachBlock.processo = undefined;
                bestFit.config.totalMemory += processo.memory;
            }
        })
    }

    return bestFit;
});