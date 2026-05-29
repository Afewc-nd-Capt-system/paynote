const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: 5000,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

(async () => {
  const loginResponse = await request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'ceoafec@gmail.com', password: 'Afec@2024' })
  });

  console.log('LOGIN status:', loginResponse.statusCode);
  console.log('LOGIN body:', loginResponse.body);
  console.log('LOGIN headers:', loginResponse.headers);

  const loginData = JSON.parse(loginResponse.body);
  if (loginData.token) {
    const verifyResponse = await request('/auth/verify', {
      headers: {
        Authorization: `Bearer ${loginData.token}`
      }
    });

    console.log('VERIFY status:', verifyResponse.statusCode);
    console.log('VERIFY body:', verifyResponse.body);
  }
})();
