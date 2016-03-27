<?php


namespace App;

use Nette\Http\FileUpload;

/**
 * @author Petr Štipek <p.stipek@email.cz>
 */
class PipasPresenter extends BasePresenter
{
	public function handleSleep($id = 3)
	{
		sleep(intval($id));
	}

	public function handleUploadFile()
	{
		$dir = __DIR__ . "/../temp/upload";
		if (!is_dir($dir)) mkdir($dir);
		$i = 1;
		foreach ($this->request->files as $input) {
			foreach ($input as $file) {
				/** @var FileUpload $file */
				move_uploaded_file($file->temporaryFile, $dir . "/" . time() . "_" . $i . ".jpg");
				$i++;
			}
		}
		echo "1";
		exit;
	}

	public function handleGetUploadStatus()
	{
		echo rand(10, 120);
		exit;
	}

}