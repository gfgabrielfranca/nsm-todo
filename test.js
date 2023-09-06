let AWSConfigured = false;
const VideoUpload = function() {
  <% unless Rails.env.test? %>
    const awsAccessKey = () => { return '<%= Settings.aws.nsm_video_frontend_upload.access_key_id %>'; }
    const awsSecretAccessKey = () => { return '<%= Settings.aws.nsm_video_frontend_upload.secret_access_key %>'; }
    const awsVideoBucketRegion = () => { return '<%= Settings.aws.nsm_video.bucket.region %>'; }
    const awsVideoBucketNameProd = () => { return '<%= Settings.aws.nsm_video.bucket.path %>'; }

    if (!AWSConfigured) {
      AWS.config.update({
        accessKeyId : awsAccessKey(),
        secretAccessKey : awsSecretAccessKey(),
        region: awsVideoBucketRegion(),
        httpOptions: { timeout: 0 }
      });
      AWSConfigured = true;
    }

    const hour = I18n.t('application.hour') + ' ';
    const hours = I18n.t('application.hours') + ' ';
    const minute = I18n.t('application.minute') + ' ';
    const minutes = I18n.t('application.minutes') + ' ';
    const second = I18n.t('application.second') + ' ';
    const seconds = I18n.t('application.seconds') + ' ';

    let _initial = true;
    this.updateState = () => { _initial = false };
    this.initial = () => { return _initial };

    let _status = 'waiting';
    this.setStatus = (value) => { _status = value};
    this.status = () => { return _status };

    let _name;
    this.setName = (value) => { _name = value };
    const name = () => { return _name; }

    let _file;
    this.setFile = (value) => { _file = value };
    this.file = () => { return _file };

    let _timeInitial;
    this.timeInitial = () => { return _timeInitial };

    let _timeNow;
    this.timeNow = () => { return _timeNow };
    this.setTimeNow = (value) => { _timeNow = value };

    let _finished = false;
    this.finished = () => { return _finished };

    let _progress;
    let _callback;
    let _container;

    const bucket = () => { return new AWS.S3({ params: { Bucket: awsVideoBucketNameProd() } }) };
    let request;
 
    this.setup = () => {
      const params = { Key: name(), ContentType: this.file().type, Body: this.file() };
      const options = { partSize: 5 * 1024 * 1024, queueSize: 5 };
      request = bucket().upload(params, options);
      _timeInitial = new Date();
      _timeNow = new Date();
    };

    let signalUploadedTries = 0;
    this.sendSignal = (url, status, callbackSuccess, callbackUnsuccess, callbackError, callbackAlways) => {
    signalUploadedTries += 1;
    console.log('Communicating with videos...');

      $.ajax({
        type: 'put',
        url: url,
        success: (data, textStatus, jqXHR) => {
          if (data.success) {
            this.setStatus(status);
            callbackSuccess();
          } else {
            callbackTryAgainOnError(
              () => { this.sendSignal(url, status, callbackSuccess, callbackUnsuccess, callbackError, callbackAlways); },
              () => {
                this.setStatus('');
                callbackUnsuccess(data.error);
              }
            );
          }
        },
        error: (jqXHR, textStatus, errorThrown) => {
          callbackTryAgainOnError(
            () => { this.sendSignal(url, status, callbackSuccess, callbackUnsuccess, callbackError, callbackAlways); },
            callbackError
          );
        }
      }).always(callbackAlways);
    };

    const callbackTryAgainOnError = (callback, callbackError) => {
      if (signalUploadedTries < 6) {
        setTimeout(callback, 10000);
      } else {
        callbackError();
      }
    };

    this.upload = (progress, callback) => {
      _progress = progress;
      _callback = callback;

      request
        .on('httpUploadProgress', (event) => { progress(event, this) })
        .send((error, data) => {
          _finished = true; callback(error, this);
        });
    };

    this.reload = () => {
      _timeInitial = new Date();
      _timeNow = new Date();
      _finished = false;
      this.upload(_progress, _callback, _container);
    };

    const secondsToHMS = (_time) => {
      const time = Number(_time);
      const hour = Math.floor(time / 3600);
      const minute = Math.floor(time % 3600 / 60);
      const second = Math.floor(time % 3600 % 60);
      return [hour, minute, second];
    };

    this.timeLeftCountDown = (_timeNow, _time) => {
      const timeLeft = new Date();
      timeLeft.setSeconds(_timeNow.getSeconds() + _time);
      return timeLeft;
    };

    this.timeLeftHumanize = (_time) => {
      const hms = secondsToHMS(_time);
      const h = hms[0];
      const m = hms[1];
      const s = hms[2];

      const hDisplay = h > 0 ? h + ' ' + (h == 1 ? hour : hours) : '';
      const mDisplay = m > 0 ? m + ' ' + (m == 1 ? minute : minutes) : '';
      const sDisplay = s > 0 ? s + ' ' + (s == 1 ? second : seconds) : '0 ' + second;
      return hDisplay + mDisplay + sDisplay + I18n.t('videos.remaining');
    };

    this.updateTime = (view) => {
      view.unbind('countdown');
      view.countdown(view.data('count'), (e) => {
        const h = parseInt(e.strftime('%H'));
        const m = parseInt(e.strftime('%M'));
        const s = parseInt(e.strftime('%S'));

        var hDisplay = h > 0 ? h + ' ' + (h == 1 ? hour : hours) : '';
        var mDisplay = m > 0 ? m + ' ' + (m == 1 ? minute : minutes) : '';
        var sDisplay = s > 0 ? s + ' ' + (s == 1 ? second : seconds) : '0 ' + second;

        view.html(hDisplay + mDisplay + sDisplay + I18n.t('videos.remaining'));
      });
    };

    const humanFileSize = (bytes, si) => {
      const thresh = si ? 1000 : 1024;
      if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
      }
      var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
      var u = -1;
      do {
        bytes /= thresh;
        ++u;
      } while (Math.abs(bytes) >= thresh && u < units.length - 1);
      return bytes.toFixed(1) + ' ' + units[u];
    };

    this.fileSizeUploadInfo = (_loaded, _total) => {
      return [humanFileSize(_loaded, true), humanFileSize(_total, true)];
    };

    this.averageUpload = (_loaded) => {
      const t = (_timeNow - _timeInitial) / 1000

      return humanFileSize(_loaded / t, true);
    };

    this.abort = () => {
      request.abort();
    };

  <% end %>
};