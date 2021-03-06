var budgetController = (function(){
    //constructors
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };
    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome){
        if(totalIncome > 0)
            this.percentage = Math.round(this.value/totalIncome * 100);
        else
            this.percentage = -1;
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    //data structure to store user inputs
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };
    
    var calculateTotal = function(type){
        var sum = 0;
        data.allItems[type] .forEach(function(current){
            sum+=current.value;
        });
        data.totals[type] = sum;
    };

    //return public object so that other modules can add items
    return {
        addItem: function(type, des, val) {
            var newItem, ID;
            //Create new ID
            if (data.allItems[type].length > 0)
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            else
                ID = 0;
            //Create new item based on 'inc' or 'exp' type
            if (type === 'exp')
                newItem = new Expense(ID, des, val);
            else if (type === 'inc')
                newItem = new Income(ID, des, val);
            //Push it into our data structure
            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem: function(type, id){
            var ids, index;
            ids = data.allItems[type].map(function(current){
                return current.id;
            });
            index = ids.indexOf(id);
            if(index!==-1)
                data.allItems[type].splice(index,1);
        },

        calculateBudget: function(){
            //total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            data.budget = data.totals.inc - data.totals.exp;
            if(data.totals.inc > 0)
                data.percentage = Math.round(data.totals.exp/data.totals.inc * 100);
            else
                data.percentage = -1;
        },

        calculatePercentages: function(){
            data.allItems.exp.forEach(function(current){
                current.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function(){
            var allPercentages = data.allItems.exp.map(function(current){
                return current.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function(){
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        }
    };
    
})();


/////////////////////////////////////////////////////////////////////////////////////////////


var UIController = (function() {
    
    //object that contains all DOM manimpulation classes
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
    
    //this must be public so it is returned as an object
    return {
        //returns the user input
        getInput: function(){
            return {
                type: document.querySelector(DOMstrings.inputType).value, //will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        //add items to the UI
        addListItem: function(obj, type){
            var html, newHtml, element;
            // Create HTML string with placeholder text
            if(type === 'inc'){
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            else if(type === 'exp'){
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }    
            //replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%',obj.value);
            //insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        //delete item from the UI
        deleteListItem: function(selectorID){
            var ele = document.getElementById(selectorID);
            ele.parentNode.removeChild(ele);
        },
        //clear the input fields
        clearFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            fieldsArr[0].focus();
        },
        //display the budget on user interface
        displayBudget: function(obj){
            document.querySelector(DOMstrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMstrings.incomeLabel).textContent = obj.totalInc;
            document.querySelector(DOMstrings.expensesLabel).textContent = obj.totalExp;
            if(obj.percentage>0 && obj.percentage<100)
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            else
                document.querySelector(DOMstrings.percentageLabel).textContent = '--';
        },

        displayPercentages: function(percentages){
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            var nodeListForEach = function(list, callback){
                for(var i=0;i<list.length;i++)
                    callback(list[i],i);
            }
            nodeListForEach(fields,function(current, index){
                if(percentages[index]>0)
                    current.textContent = percentages[index]+'%';
                else
                    current.textContent = '--';
            });
        },

        displayMonth: function(){
            var now, year, month, monthArr;
            monthArr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
            now = new Date();
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = monthArr[month] + ' ' + year;
        },
        //returns the DOM classes
        getDOMstrings: function() {
            return DOMstrings;
        }
    };

})();


/////////////////////////////////////////////////////////////////////////////////////////////


var controller = (function(budgetCtrl, UICtrl){
    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();
        //press enter key or click to add item
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13)
                ctrlAddItem();
        });
        //using Event Deligation
        document.querySelector(DOM.container).addEventListener('click',ctrlDeleteItem);
    };

    //update and calculate budget
    var updateBudget = function(){
        //calculate the budget
        budgetCtrl.calculateBudget();
        var budget = budgetCtrl.getBudget();
        //display the budget on UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function(){
        budgetCtrl.calculatePercentages();
        var percentages = budgetCtrl.getPercentages();
        UICtrl.displayPercentages(percentages);
    };

    //function to add item
    var ctrlAddItem = function(){
        var input, newItem;
        //get the field input data
        input = UICtrl.getInput();     
        if(input.description !=="" && !isNaN(input.value) && input.value > 0){   
            //add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            //add the item to the UI
            UICtrl.addListItem(newItem, input.type);
            //clear the input fields
            UICtrl.clearFields();
            //calculate and update budget
            updateBudget();
            updatePercentages();
        }
    };

    //function to Delete item
    //passing 'event' attribute to know what the target element is
    var ctrlDeleteItem = function(event){
        var itemID, splitID, type, ID;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if(itemID){
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
            //delete item from the budget DS
            budgetCtrl.deleteItem(type, ID);
            //delete item from the UI
            UICtrl.deleteListItem(itemID);
            //update & show the new budget
            updateBudget();
            updatePercentages();
        }
    };
    
    return{
        init: function(){
            console.log('Application has started.');
            UICtrl.displayMonth();
            updateBudget();
            setupEventListeners();
        }
    };
    
})(budgetController, UIController);


/////////////////////////////////////////////////////////////////////////////////////////////


controller.init();