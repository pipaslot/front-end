<?php


namespace App;

use Nette\Application\UI\Form;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class ModalPresenter extends BasePresenter
{


	public function renderModalContent()
	{
		sleep(2);
	}

	public function actionModalClose()
	{
		$this->terminate();
	}

	public function actionModalFail()
	{
		$this->error("Must fail");
	}

	public function actionSnippet()
	{
		$this->redrawControl('title');
		$this->redrawControl('content');
	}

	protected function createComponentModalForm()
	{
		$form = new Form();
		$form->addText("name", "Name");
		$form->addSubmit("submit", "Send")
			->getControlPrototype()->class[] = 'btn btn-primary';

		$form->addSubmit("save", "Save");
		$form->onSubmit[] = function (Form $form) {
			$form->addError("Expected error message");
		};
		return $form;
	}

}