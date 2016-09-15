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
        var quantum =  $scope.quantum;
        $scope.processArray.forEach(function (eachProcess) {
            startProcess(eachProcess, quantum);
        })
    }

    function startProcess(eachProcess, quantum){
        if(eachProcess.processState != 'Finalizado') {
            var timeToRun = quantum > eachProcess.timeLeft ? eachProcess.timeLeft : quantum;
            var increaseCounter = function () {
                eachProcess.runningTime += 1;
                eachProcess.timeLeft -= 1;
                eachProcess.completionPercent = Math.round(eachProcess.runningTime / eachProcess.executionTime * 100);
                eachProcess.processState = eachProcess.completionPercent == 100 ? 'Finalizado' : 'Executando';
                eachProcess.timeLeft = eachProcess.executionTime - eachProcess.runningTime;
            }
            $interval(increaseCounter, 1000, timeToRun);
        }
    }

    function checkProcessFinalizados(processArray ,eachProcess) {
        if(eachProcess.completionPercent == 100){
            eachProcess.processState = 'Pronto';
            processArray.pop();
        }
    }
}
app.controller("RobinRoundController", ["$scope","$interval" ,RoundRobinController]);
