sistemasOperacionais.controller('processController', function ($rootScope, $scope, $interval, AlgorithmFactoryService) {
    var service;

    $scope.processos = [];
    $scope.aptos = [[], [], [], []]
    $scope.config;


    $scope.$on('iniciar', function (events, args) {
        $scope.config = args;
        service = AlgorithmFactoryService.buildAlgorithm($scope.config.algoritmo);
        service.configurar(args);
        createProcess(service, args.processos);
        $scope.aptos = service.aptos;

        service.executar();
    });

    $scope.$on('parar', function (events, args) {
        $scope.getProcessos().length = 0;
    });

    var createProcess = function (service, processos) {
        $scope.getProcessos().length = 0;
        $scope.aptos.length = 0;
        var i;

        for (i = 0; i < processos; i++) {
            $scope.addProccess();
        }
    }

    $scope.stateClass = function (row, type) {
        var clazz = "success";
        switch (row.state) {
            case 'Aguardando':
                clazz = "warning";
                break;
            case 'Executando':
                clazz = "info active";
                break;
        }

        return type + "-" + clazz;
    };

    $scope.getProcessos = function () {
        return $scope.processos;
    }

    $scope.addProccess = function () {
        //Adicionando o processo dependendo do Algoritmo
        service.createProcess($scope.getProcessos());
    };

    $scope.filterNaoExecutando = function(processo) {
        return processo.prioridade === 0 && processo.state !== 'Executando';
    }
});