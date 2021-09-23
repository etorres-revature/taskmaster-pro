let tasks = {};

setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 100 * 60 * 30);

const auditTask = function (taskEl) {
  // get date from task element
  let date = $(taskEl).find("span").text().trim();

  //convert to moment object at 5:00pm
  let time = moment(date, "L").set("hour", 17);

  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

const createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  let taskLi = $("<li>").addClass("list-group-item");
  let taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  let taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

const loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

const saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

$("#modalDueDate").datepicker({ minDate: 1 });

$(".list-group").on("click", "p", function () {
  let text = $(this).text().trim();
  let textInput = $("<textarea>").addClass("form-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  let text = $(this).val().trim();

  //get the parent ul's id attribute
  let status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  let index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  let taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked
$(".list-group").on("click", "span", function () {
  //get current text
  let date = $(this).text().trim();

  //create new input element
  let dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  //swap out the elements
  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calendar is closed, force a change event on dateInput
      $(this).trigger("change");
    },
  });

  // automatically focus on new element
  dateInput.trigger("focus");
});

// due date altered state removal
$(".list-group").on("change", "input[type='text']", function () {
  // get current date text
  let date = $(this).val().trim();

  // get parent ul's id attribute
  let status = $(this).closest(".list-group").attr("id").replace("list-", "");

  //get the task's position in the list of li elements
  let index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstap classes
  let taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into audtiTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".trash").addClass("trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".trash").removeClass("trash-drag");
  },
  over: function (event) {
    $(this).addClass("dropover-active");
    $(".trash").addClass("trash-active");
  },
  out: function (event) {
    $(this).removeClass("dropover-active");
    $(".trash").removeClass("trash-active");
  },
  update: function (event) {
    // array to store tasks
    let tempTaskArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        let text = $(this).find("p").text().trim();

        let date = $(this).find("span").text().trim();

        // add task data to temp task array as object
        tempTaskArr.push({
          text,
          date,
        });
      });
    // trim down list's ID to match object property
    let arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempTaskArr;
    saveTasks();
  },
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    console.log("drop");
    ui.draggable.remove();
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
  },
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  let taskText = $("#modalTaskDescription").val();
  let taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (let key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();
