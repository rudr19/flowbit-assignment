const ensureTenantIsolation = (req, res, next) => {
  req.tenantFilter = { customerId: req.user.customerId };  
  const originalJson = res.json; 
  res.json = function(data) {
    if (Array.isArray(data)) {
      data = data.filter(item => 
        !item.customerId || item.customerId === req.user.customerId
      );
    } else if (data && typeof data === 'object' && data.customerId) {
      if (data.customerId !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied to this resource' });
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

const addTenantToBody = (req, res, next) => {

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    req.body.customerId = req.user.customerId;
  }
  next();
};

module.exports = {
  ensureTenantIsolation,
  addTenantToBody
};