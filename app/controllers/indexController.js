var indexController = function($scope) {

    initScopes();

    function initScopes(){
        $scope.algorithmOptions = ['Round Robin', 'Least Time to Go (LTG)', 'Merge Fit'];
        $scope.algorithmSelected = 'Round Robin';
        $scope.processStates = ['Pronto', 'Esperando', 'Executando'];
        $scope.cores = 0;
        $scope.numberOfProcess = 0;
        $scope.quantum = 0;
        $scope.processArray = [];
    }

    $scope.createProcess = function (){
        var eachProcess = {
            id : $scope.numberOfProcess++,
            executionTime : getRandomInt(4,20),
            processState : $scope.processStates.find('Pronto'),
            priority : getRandomInt(0,3),
            interval : 'TODO'
        };
        if(algorithmSelected == algorithmOptions.find('Least Time to Go (LTG)')){
            eachProcess.deadline = 'TODO';
        }

    };

    $scope.iniciar = function(){
        if($scope.cores < 1 || $scope.cores > 64){
            toastr["error"]("Numero de processadores fora da faixa aceitavel");
            return
        }

    }


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

};

app.controller("indexController", ["$scope", indexController]);