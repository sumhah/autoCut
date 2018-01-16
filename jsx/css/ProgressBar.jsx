/**
 * Created by sumhah on 18/1/15.
 */

//////////////////////////////////// ProgressBar //////////////////////////////////////

// "ProgressBar" provides an abstracted interface to the progress bar DOM. It keeps
// track of the total steps and number of steps completed so task steps can simply call
// nextProgress().

function ProgressBar() {
    this.totalProgressSteps = 0;
    this.currentProgress = 0;
}

// You must set cssToClip.totalProgressSteps to the total number of
// steps to complete before calling this or nextProgress().
// Returns true if aborted.
ProgressBar.prototype.updateProgress = function (done) {
    if (this.totalProgressSteps == 0)
        return false;

    return !app.updateProgress(done, this.totalProgressSteps);
};

// Returns true if aborted.
ProgressBar.prototype.nextProgress = function () {
    this.currentProgress++;
    return this.updateProgress(this.currentProgress);
};
