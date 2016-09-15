var RoundRobinController = function($scope, $interval) {
    $scope.iniciar = function () {
        if ($scope.cores < 1 || $scope.cores > 64) {
            return toastr["error"]("Numero de processadores fora da faixa aceitavel");
        }else if($scope.quantum < 2 || $scope.quantum > 20){
            return toastr["error"]("Quantum fora da faixa aceitavel");
        }
        $scope.isProgramStarted = true;
        if($scope.algorithmSelected == 'Round Robin'){
            startRoundRobin();
        }
    };

    function startRoundRobin(){
        var stop;
        var quantum =  $scope.quantum;
        while ($scope.processArray.length > 0){
            $scope.coresArray.forEach(function (eachCore) {
                if(eachCore.state == 'Ocioso'){
                    $scope.processArray.forEach(function (eachProcess) {
                        if(eachProcess.processState == 'Pronto'){
                            eachCore.state = 'Executando';
                            startProcess(stop,eachProcess, quantum);

                        }
                    })
                }
            })
        }
    }

    function startProcess(stop,eachProcess, quantum){
        eachProcess.processState = 'Executando';
        var increaseCounter = function () {
            eachProcess.runningTime = $timeout() + 1;
        }
        $interval(increaseCounter, 1000);


    }

}
app.controller("RobinRoundController", ["$scope","$interval" ,RoundRobinController]);
