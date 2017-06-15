import Ember from 'ember';

export default Ember.Route.extend({
	todos: Ember.inject.service(),
	model() {
		return this.get('todos').getAllTodos(null, {useCache: false});

	}
});