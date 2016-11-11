sistemasOperacionais.factory('AlgorithmFactoryService', function (RoundRobinAlgorithmService, LeastTimeToGoAlgorithmService) {
    var algorithm = {};

    algorithm.buildAlgorithm = function(value) {
        var service;
        switch (value) {
            case '1':
                service = RoundRobinAlgorithmService;
                return service;

            case '2':
                service = LeastTimeToGoAlgorithmService;
                return service
        }

    };

    return algorithm;
});

sistemasOperacionais.factory('MemoryAlgorithmFactoryService', function (BestFitService,QuickFitService) {
    var memoryAlgorithm = {};

    memoryAlgorithm.buildAlgorithm = function (value) {
        var service;

        switch (value){
            case '1':
                service = BestFitService;
                return service;
            case '2':
                 return QuickFitService
        }
    };



    return memoryAlgorithm;
})
    .service('MemoryHelper',function(){
        var memory;
        return {
            setMemory: function(mem){
                memory = mem
            },
            isAlocado: function(processo){
                return !memory.blocks.every(function(block){
                    return !(block.processo && block.processo.pid == processo.pid);
                })
            },
            isFull: function(size){
                return size > memory.size || memory.size < 1
            },
            random: function(min,max){
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            encerrarProcesso: function(processo,algoritmo){
                memory.blocks.forEach(function(block){
                    if(block.processo && block.processo.pid == processo.pid){
                        block.name = 'DISPONIVEL';
                        block.processo = null;
                    }
                });
                memory.size += processo.memory;
                algoritmo.config.totalMemory += processo.memory;
            }
        }
    });
