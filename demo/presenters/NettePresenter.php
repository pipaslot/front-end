<?php


namespace App;

use Nette\Application\AbortException;
use Nette\Application\BadRequestException;
use Nette\Application\UI\Form;
use Nette\Http\IResponse;

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

	/**
	 * @return Form
	 */
	protected function createComponentFormAjaxImage()
	{
		$form = $this->createForm();
		$form->removeComponent($form['submit']);
		$form->addImage('submit', $this->template->basePath . '/button.jpg', "Button");
		$form->setDefaults(array(
			"snippet" => "formAjaxImage"
		));
		return $form;
	}

	/******************************* Error **************************************/
	public function handleErrorException()
	{
		throw new \ErrorException("Testing error was caused.");
	}

	public function handleAbortException()
	{
		throw new AbortException("Request was aborted");
	}

	public function handleWait10Seconds()
	{
		sleep(10);
		echo "ok";
	}

	public function handleError403()
	{
		$this->error("Access denied", IResponse::S403_FORBIDDEN);
	}

	public function handleError404()
	{
		$this->error("Page not found", IResponse::S404_NOT_FOUND);
	}

	/******************************* Message **************************************/
	public function handleFlashMessages()
	{
		$this->redrawControl("flashes");
	}

	public function handleLoadJsonMessages()
	{
		$this->sendJson(array(
			"messages" => array(
				"info" => array(
					"First twice",
					"First twice"
				),
				"danger" => array(
					"Second"
				),
				"success" => array(
					"Three three times",
					"Three three times",
					"Three three times"
				),
				"warning" => array(
					"Four"
				)
			)
		));
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

	public function formSleep()
	{
		sleep(1);
	}

	/******************************* table-fixedHeader **************************************/

	/******************************* Unique **************************************/

	/******************************* Missing snippet **************************************/
	public function actionMissingSnippet2()
	{
		$this->redrawControl("undefinedOnPrevious");
	}

	/******************************* Upload **************************************/
	public function handleFileUpload()
	{
		foreach ($this->request->files as $name => $fileList) {
			$this->flashMessage($name . ": " . count($fileList));
		}
		$this->redrawControl("flashMessages");
	}

	public function handleGetUploadStatus()
	{
		echo rand(10, 110);
		exit;
	}
}