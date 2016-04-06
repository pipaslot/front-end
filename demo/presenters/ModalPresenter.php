<?php


namespace App;

use Nette\Application\UI\Form;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class ModalPresenter extends BasePresenter
{
	public function renderContent()
	{
		sleep(1);
	}

	public function actionClose()
	{
		$this->terminate();
	}

	public function actionFail()
	{
		$this->error("Must fail");
	}

	public function actionSnippets()
	{
		$this->redrawControl('modalTitle');
		$this->redrawControl('modalContent');
	}

	protected function createComponentForm()
	{
		$form = new Form();
		$form->addText("name", "Name-required")
			->setRequired();
		$form->addTextArea("description", "Description");
		$form->addSubmit("submit", "Send")
			->getControlPrototype()->class[] = 'btn btn-primary';

		$form->addSubmit("save", "Save");
		$form->onSubmit[] = function (Form $form) {
			$form->addError("Expected error message");
		};
		$form->onSuccess[] = function () {
			$this->sendJson(array('message' => 'Saved'));
		};
		return $form;
	}

	public function handleJsonMessage()
	{
		$this->sendJson(["Message passed by method \$this->sendJson(['My message']) at presenter"]);
	}

	public function handlePayloadMessage()
	{
		$this->payload->message = "Message passed by methods \$this->payload->message = 'My message' and \$this->sendPayload(); at presenter";
		$this->payload->messageInfo = "Custom info";
		$this->payload->messageError = "Custom error";
		$this->payload->messageWarning = "Custom warning";
		$this->payload->messageSuccess = "Custom success";
		$this->sendPayload();
	}

	public function handlePayloadMessages()
	{
		$this->payload->message = ["Message passed by methods \$this->payload->message = 'My message' and \$this->sendPayload(); at presenter"];
		$this->payload->messageInfo = ["Custom info"];
		$this->payload->messageError = ["Custom error"];
		$this->payload->messageWarning = ["Custom warning"];
		$this->payload->messageSuccess = ["Custom success twice", "Custom success twice"];
		$this->sendPayload();
	}

	public function handleRefresh()
	{
		$this->payload->refresh = true;
		$this->sendPayload();
	}

	public function handleFileUpload()
	{
		echo "1";
		$this->terminate();
	}

	public function handleRedirect()
	{
		$this->redirect("redirectedPage");
	}

}