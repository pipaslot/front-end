<?php


namespace App;

use Nette\Application\AbortException;
use Nette\Application\BadRequestException;
use Nette\Application\UI\Form;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class NettePresenter extends BasePresenter
{

	public function actionDefault()
	{
		$this->redirect("init");
	}

	/******************************* Init**************************************/

	/**
	 * @return Form
	 */
	protected function createComponentFormNoAjax()
	{
		$form = $this->createForm();
		$form->getElementPrototype()->class[] = "no-ajax";
		$form->setDefaults(array(
			"snippet" => "formNoAjax"
		));
		return $form;
	}

	/**
	 * @return Form
	 */
	protected function createComponentFormAjax()
	{
		$form = $this->createForm();
		$form->setDefaults(array(
			"snippet" => "formAjax"
		));
		return $form;
	}

	/**
	 * @return Form
	 */
	protected function createComponentFormAjaxSelect()
	{
		$form = $this->createForm();
		$form["select"]->controlPrototype->class[] = "submit";
		$form->setDefaults(array(
			"snippet" => "formAjaxSelect"
		));
		return $form;
	}

	/******************************* Error **************************************/
	public function handleErrorException()
	{
		throw new \ErrorException("Testing error was caused.");
	}

	public function handleBadRequestException()
	{
		throw new BadRequestException("Requested page not found");
	}

	public function handleAbortException()
	{
		throw new AbortException("Request was aborted");
	}

	public function handleWait10Seconds()
	{
		sleep(10);
	}

	/******************************* Message **************************************/
	public function handleFlashMessages()
	{
		$this->redrawControl("flashes");
	}

	/******************************* Redirect **************************************/
	public function handleRedirectToPage2()
	{
		$this->redirect("redirect2");
	}

	public function renderRedirect2()
	{
		$this->redrawControl("content");
	}

	public function handleRedirectToPage3()
	{
		$this->redirect("redirect3");
	}

	public function handleRedirectToFailing()
	{
		$this->redirect("redirectXXX");
	}

	public function handleRedirectWithoutAjax()
	{
		$this->payload->noAjax = true;
		$this->redirect("redirect3");
	}

	/******************************* Spinner **************************************/

	protected function createComponentFormSpinnerBody()
	{
		$form = $this->createForm();
		$form->setDefaults(array(
			"snippet" => "formSpinnerBody"
		));
		$form->onSubmit[] = array($this, "formSleep");
		return $form;
	}

	protected function createComponentFormSpinnerSnippetViaForm()
	{
		$snippet = "formSpinnerSnippetViaForm";
		$form = $this->createForm();
		$form->elementPrototype->addAttributes(array(
			"data-spinner" => $this->getSnippetId($snippet)
		));
		$form->setDefaults(array(
			"snippet" => $snippet
		));
		$form->onSubmit[] = array($this, "formSleep");
		return $form;
	}

	protected function createComponentFormSpinnerSnippetViaButton()
	{
		$snippet = "formSpinnerSnippetViaButton";
		$form = $this->createForm();
		$form['submit']->controlPrototype->addAttributes(array(
			"data-spinner" => $this->getSnippetId($snippet)
		));
		$form->setDefaults(array(
			"snippet" => $snippet
		));
		$form->onSubmit[] = array($this, "formSleep");
		return $form;
	}

	protected function createComponentFormNoSpinner()
	{
		$snippet = "formNoSpinner";
		$form = $this->createForm();
		$form->elementPrototype->class[] = "no-spinner";
		$form['submit']->controlPrototype->addAttributes(array(
			"data-spinner" => $this->getSnippetId($snippet)
		));
		$form->setDefaults(array(
			"snippet" => $snippet
		));
		$form->onSubmit[] = array($this, "formSleep");
		return $form;
	}

	public function formSleep(Form $form)
	{
		sleep(1);
	}

	/******************************* table-fixedHeader **************************************/

	/******************************* Unique **************************************/
}