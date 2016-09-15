var indexController = function($scope, $interval) {

    initScopes();

    function initScopes() {
        $scope.algorithmOptions = ['Round Robin', 'Least Time to Go (LTG)', 'Merge Fit'];
        $scope.algorithmSelected = 'Round Robin';
        $scope.processStates = ['Pronto', 'Executando', 'Finalizado', 'Abortado'];
        $scope.cores = 1;
        $scope.counter = 0;
        $scope.coresArray = [];
        $scope.numberOfProcess = 0;
        $scope.processArray = [];
        $scope.isProgramStarted = false;
        $scope.quantum = 2;
    }

    $scope.checkCores = function () {
        while ($scope.cores != $scope.coresArray.length) {
            if ($scope.cores > $scope.coresArray.length) {
                //Add Cores
                while ($scope.cores != $scope.coresArray.length) {
                    var id = $scope.counter;
                    var eachCore = {
                        id: id,
                        state: 'Ocioso'
                    };
                    $scope.counter++;
                    $scope.coresArray.push(eachCore);
                }
            } else {
                //Remove Cores
                while ($scope.cores != $scope.coresArray.length) {
                    $scope.coresArray.pop();
                }
            }
        }
    };

    $scope.checkProcess = function () {
        while($scope.numberOfProcess != $scope.processArray.length){
            if($scope.numberOfProcess > $scope.processArray.length){
                //Add process
                while($scope.numberOfProcess != $scope.processArray.length){
                    var newProcess = $scope.createProcess();
                    $scope.processArray.push(newProcess);
                }
            }else{
                // Remove Process
                while ($scope.numberOfProcess != $scope.processArray.length){
                    $scope.processArray.pop();
                }
            }
        }
    };

    $scope.createProcess = function () {
        var id = $scope.counter;
        var eachProcess = {
            id: id,
            executionTime: getRandomInt(4,20),
            processState: 'Pronto',
            runningTime : 0,
            priority: getRandomInt(0, 3),
            interval: 'TODO'
        };
        eachProcess.completionPercent =  Math.round(eachProcess.runningTime/eachProcess.executionTime*100);
        eachProcess.timeLeft = eachProcess.executionTime - eachProcess.runningTime;
        if ($scope.algorithmSelected == 'Least Time to Go (LTG)') {
            eachProcess.deadline = 'TODO';
        }
        $scope.counter++;
        return eachProcess;
    };


    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

};
app.controller("indexController", ["$scope", indexController]);
