import Ember from 'ember';

export default Ember.Controller.extend({
  todos: Ember.inject.service(),
  remaining: Ember.computed.filterBy('model', 'completed', false),
  completed: Ember.computed.filterBy('model', 'completed'),
  actions: {
    createTodo(e) {
      if (e.keyCode === 13 && !Ember.isBlank(e.target.value)) {
        this.get('todos').createTodo({
          title: e.target.value.trim(),
          completed: false
        }).then(newEl => this.get('model').pushObject(newEl));
        e.target.value = '';
      }
    },

    clearCompleted() {
      const todos = this.get('todos');
      const completed = this.get('completed');
      const deleted = completed.map(el => todos.deleteTodo(el));

      Ember.RSVP.Promise.all(deleted).then(() => {
        this.get('model').removeObjects(completed);
      });

    }
  }
});