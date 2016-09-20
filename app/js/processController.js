sistemasOperacionais.controller('processController', function ($rootScope, $scope, $interval, AlgorithmFactoryService) {
        var service;

        $scope.aptos = [[], [], [], []]
        $scope.procs = [];
        $scope.config;


    $scope.$on('iniciar', function (events, args) {
        $scope.config = args;
        service = AlgorithmFactoryService.construirAlgoritmo($scope.config.algoritmo);
        service.configurar(args);
        createProcess(service, args.processos);
        $scope.aptos = service.aptos;

        service.executar();
    });

    $scope.$on('parar', function (events, args) {
        $scope.processos().length = 0;
    });

    var createProcess = function (service, processos) {
        $scope.processos().length = 0;
        $scope.aptos.length = 0;
        var i;

        for (i = 0; i < processos; i++) {
            $scope.addProccess();
        }
    }

        $scope.setWidth = function (row) {
            var width = row.progress + "%";
            return {width: width}
        };

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
            return $scope.procs;
        }

        $scope.addProccess = function () {
            service.createProcess($scope.getProcessos());
        };

        $scope.filterNaoExecutando = function(processo) {
            return processo.prioridade === 0 && processo.state !== 'Executando';
        }
    });