import Ember from 'ember';

export default Ember.Controller.extend({
  githubissues: Ember.inject.service(),
  init(){
    const gi = this.get('githubissues');
    this.set('gi', gi);
  },
  actions: {
    testik() {
      this.gi.getAllIssues().then(data => {
        this.set('model.issues', data);
      })
    },
    del() {
      this.set('model.issues', []);
    },
    cret() {
    
      this.gi.newIssue().then(data => {
        this.set('model.issues', data);
      })
    }
  }
});
