<?php


namespace App;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class PipasPresenter extends BasePresenter
{
	public function handleSleep($id = 3)
	{
		sleep(intval($id));
	}

}