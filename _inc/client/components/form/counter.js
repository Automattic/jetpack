let idCounter = 0;

module.exports = function() {
	return 'formId-' + ( idCounter++ );
};
