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
        };

    }

    return algorithm;
});

sistemasOperacionais.factory('MemoryAlgorithmFactoryService', function (BestFitService) {
    var memoryAlgorithm = {};

    memoryAlgorithm.buildAlgorithm = function (value) {
        var service;

        switch (value){
            case '1':
                service = BestFitService;
                return service;
        }
    }



    return memoryAlgorithm;
});