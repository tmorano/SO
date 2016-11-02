sistemasOperacionais.factory('BestFitService', function () {
    var bestFit = {};

    bestFit.iniciarMemoria = function (args) {
        bestFit.config = args;
        bestFit.memoryBlock = args.memoryBlock;
        bestFit.count = {
            totalBlockMemory : bestFit.config.totalMemory
        };

    }

    bestFit.adicionarNaMemoria = function (processo) {
        var memoryAllocated = false;
        //Verificando no MemoryBlock se existe algum espaço com encaixe e livre
            bestFit.config.arrayOfProcessMemory.series.forEach(function(eachBlock){
                if(eachBlock.pid == processo.pid){
                    memoryAllocated = true;
                }else if(eachBlock.data[1] == processo.memory && eachBlock.pid == undefined){
                    eachBlock.name = 'Processo: ' + processo.pid;
                    eachBlock.pid = processo.pid;
                    memoryAllocated = true;
                    bestFit.config.totalMemory -= processo.memory;
                }
            })

        // Criar novo bloco caso nao encontre
        if(!memoryAllocated) {
            // verificar a disponibilidade de memoria e core para o novo bloco
            if (bestFit.count.totalBlockMemory > processo.memory) {
                var newBlock = {
                    pid : processo.pid,
                    name : 'Processo ' + processo.pid,
                    data : [0,processo.memory]
                }
                bestFit.config.arrayOfProcessMemory.series.push(newBlock);
                bestFit.config.totalMemory -= processo.memory;
                bestFit.count.totalBlockMemory -= processo.memory;
            }else{
                // Abortar processo
                processo.state = 'Abortado';
            }
        }
    }

    bestFit.encerrarProcesso = function(processo){
                bestFit.config.arrayOfProcessMemory.series.forEach(function (eachBlockFromView){
                    if(eachBlockFromView.pid == processo.pid ){
                        eachBlockFromView.pid = undefined;
                        eachBlockFromView.name = 'DISPONIVEL';
                        bestFit.config.totalMemory += processo.memory;
                        return;
                    }
                    })
            }

    return bestFit;
});