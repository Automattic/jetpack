import firewall from './firewall';
import history from './history';
import loginProtection from './login-protection';
import monitor from './monitor';
import scan from './scan';
import type { ProtectSection } from './types';

/** Sections in the order their cards appear. */
const sections: ProtectSection[] = [ scan, monitor, firewall, loginProtection, history ];

export default sections;
