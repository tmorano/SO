sistemasOperacionais.factory('AlgorithmFactoryService', function (RoundRobinAlgorithmService) {
    var algorithm = {};

    algorithm.buildAlgorithm = function(value) {
        var service;
        switch (value) {
            case '1':
                service = RoundRobinAlgorithmService;
        };

        return service;
    }

    return algorithm;
});