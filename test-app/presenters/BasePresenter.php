<?php


namespace App;

use Nette\Application\UI\Form;
use Nette\Application\UI\Presenter;
use Pipas\Forms\FormFactory;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class BasePresenter extends Presenter
{
	/** @var  FormFactory @inject */
	public $formFactory;
	private $redrawSnippets = array();

	/**
	 * @param $name
	 * @param null $duration Call sleep for selected time
	 */
	public function handleInvalidate($name,$duration = null)
	{
		$this->redrawControl($name);
		$this->redrawSnippets[$name] = $name;
		if($duration)sleep((int)$duration);
	}

	protected function beforeRender()
	{
		parent::beforeRender();
		$this->template->redrawSnippets = $this->redrawSnippets;
	}

	/**
	 * @return Form
	 */
	protected function createForm()
	{
		$form = $this->formFactory->createBootstrap();
		$form->addHidden("snippet");
		$form->addText("text", "Input");
		$form->addSelect("select", "Select", array("First", "Second", "Third"));
		$form->addSubmit("submit");
		$form->onSuccess[] = array($this, "formSuccess");
		return $form;
	}

	/**
	 * @internal
	 * @param Form $form
	 */
	public function formSuccess(Form $form, $values)
	{
		$form->addError("Submited: " . date("H:i:s"));
		$form->addError("Used Ajax: " . ($this->isAjax() ? "True" : "False"));
		$this->handleInvalidate($values['snippet']);
	}
}