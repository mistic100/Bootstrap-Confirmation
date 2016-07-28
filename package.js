Package.describe({
  name: 'mistic100:bootstrap-confirmation',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  api.use('jquery', 'client');
  api.use('twbs:bootstrap@3.3.7', 'client');;
  api.addFiles('lib/bootstrap-confirmation.js', 'client')
});

