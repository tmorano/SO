sistemasOperacionais.factory('MemorySwappingService', function () {
var virtualMemory = {};

    virtualMemory.swap = function (memoryService) {
        //Vamos verificar o espaço da memoria está abaixo de 70%
        var memoryUsage =  Math.floor(((memoryService.memory.totalSize - memoryService.memory.size) / memoryService.memory.totalSize) * 100);
        if(memoryUsage > 70){
            // Realizar o swap dos processos aguardando, iniciar pelo ultimo da fila de prioridades
            var processToRemove = [];
            for(var i=0; i<=3; i++){
                if(memoryService.config.filaDePrioridade[i].length-1){
                    for(var j = memoryService.config.filaDePrioridade[i].length-1; j>0; j--){
                        var proc = memoryService.config.filaDePrioridade[i][j];
                        if(proc.state = 'Aguardando'){
                            processToRemove.push(proc);
                            //verifica se ja é o suficiente para voltar a margem aceitavel
                        }
                    }
                }
            }

        }
    }
    return virtualMemory;
});