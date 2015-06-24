var Project1 = React.createClass({
	getDefaultProps: function () {
		return {project_title: "About React-Masked-Field",
						project_description: "The MaskedField component is a text input field that allows you to restrict and format the values that can be entered into it, while informing the user of the expected input. Common uses include dates, phone numbers, social security numbers and tax IDs."};
	},
	render: function () {
		return (
			<div>
				<h4>{this.props.project_title}</h4>
				<p>{this.props.project_description}</p>
			</div>
		);
	}
});

React.renderComponent(<Project1/>, null, document.getElementById('project-description'));