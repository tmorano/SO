sistemasOperacionais.factory('AlgorithmFactoryService', function (RoundRobinAlgorithmService) {
    var algoritmo = {};

    algoritmo.construirAlgoritmo = function(tipo) {
        var service;
        switch (tipo) {
            case '1':
                service = RoundRobinAlgorithmService;
        };

        return service;
    }

    return algoritmo;
});